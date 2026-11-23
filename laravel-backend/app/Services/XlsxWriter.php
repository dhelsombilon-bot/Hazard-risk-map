<?php

namespace App\Services;

use RuntimeException;
use ZipArchive;

/**
 * Minimal, dependency-free .xlsx writer (one worksheet).
 *
 * Usage:
 *   $x = new XlsxWriter('Sheet name');
 *   $x->addRow(['A', 'B'], XlsxWriter::STYLE_HEADER);
 *   $x->merge(1, 1, 4);           // merge row 1, columns 1..4
 *   $path = $x->save();           // temp file path
 */
class XlsxWriter
{
    public const STYLE_DEFAULT = 0;
    public const STYLE_TITLE = 1;
    public const STYLE_LABEL = 2;
    public const STYLE_HEADER = 3;
    public const STYLE_CELL = 4;
    public const STYLE_SECTION = 5;
    public const STYLE_TOTAL = 6;
    public const STYLE_SUBTITLE = 7;

    private array $rows = [];      // [ [cells, styleOrStyles], ... ]
    private array $merges = [];
    private array $widths = [];    // col index (1-based) => width
    private ?string $autoFilter = null;
    private ?int $freezeRow = null;

    public function __construct(private string $sheetName = 'Report')
    {
        $this->sheetName = mb_substr(preg_replace('/[\\\\\/\?\*\[\]:]/', '', $sheetName), 0, 31) ?: 'Report';
    }

    /** @param int|int[] $style one style for all cells, or one per cell */
    public function addRow(array $cells = [], int|array $style = self::STYLE_DEFAULT): int
    {
        $this->rows[] = [array_values($cells), $style];
        return count($this->rows);
    }

    public function merge(int $row, int $fromCol, int $toCol): void
    {
        if ($toCol > $fromCol) {
            $this->merges[] = self::ref($fromCol, $row).':'.self::ref($toCol, $row);
        }
    }

    public function setWidth(int $col, float $width): void
    {
        $this->widths[$col] = $width;
    }

    public function autoFilter(int $row, int $fromCol, int $toCol, int $lastRow): void
    {
        $this->autoFilter = self::ref($fromCol, $row).':'.self::ref($toCol, max($row, $lastRow));
    }

    public function freezeBelow(int $row): void
    {
        $this->freezeRow = $row;
    }

    public function save(): string
    {
        $path = tempnam(sys_get_temp_dir(), 'xlsx');
        $zip = new ZipArchive();
        if ($zip->open($path, ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('Unable to create xlsx file.');
        }

        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            .'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            .'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            .'</Types>');

        $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            .'</Relationships>');

        $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            .'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            .'</Relationships>');

        $definedNames = $this->autoFilter
            ? '<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'
                .self::esc("'".$this->sheetName."'!".self::absolute($this->autoFilter)).'</definedName></definedNames>'
            : '';

        $zip->addFromString('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            .'<sheets><sheet name="'.self::esc($this->sheetName).'" sheetId="1" r:id="rId1"/></sheets>'
            .$definedNames
            .'</workbook>');

        $zip->addFromString('xl/styles.xml', $this->stylesXml());
        $zip->addFromString('xl/worksheets/sheet1.xml', $this->sheetXml());
        $zip->close();

        return $path;
    }

    private function sheetXml(): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">';

        $xml .= '<sheetViews><sheetView workbookViewId="0" showGridLines="0">';
        if ($this->freezeRow) {
            $xml .= '<pane ySplit="'.$this->freezeRow.'" topLeftCell="A'.($this->freezeRow + 1).'" activePane="bottomLeft" state="frozen"/>';
        }
        $xml .= '</sheetView></sheetViews>';

        if ($this->widths) {
            ksort($this->widths);
            $xml .= '<cols>';
            foreach ($this->widths as $col => $w) {
                $xml .= '<col min="'.$col.'" max="'.$col.'" width="'.round($w, 2).'" customWidth="1"/>';
            }
            $xml .= '</cols>';
        }

        $xml .= '<sheetData>';
        foreach ($this->rows as $i => [$cells, $style]) {
            $r = $i + 1;
            $height = match (is_array($style) ? null : $style) {
                self::STYLE_TITLE => ' ht="26" customHeight="1"',
                self::STYLE_HEADER, self::STYLE_SECTION => ' ht="20" customHeight="1"',
                default => '',
            };
            $xml .= '<row r="'.$r.'"'.$height.'>';
            foreach ($cells as $c => $value) {
                $s = is_array($style) ? ($style[$c] ?? self::STYLE_DEFAULT) : $style;
                $ref = self::ref($c + 1, $r);
                if ($value === null || $value === '') {
                    if ($s !== self::STYLE_DEFAULT) {
                        $xml .= '<c r="'.$ref.'" s="'.$s.'"/>';
                    }
                } elseif (is_int($value) || is_float($value)) {
                    $xml .= '<c r="'.$ref.'" s="'.$s.'"><v>'.$value.'</v></c>';
                } else {
                    $xml .= '<c r="'.$ref.'" s="'.$s.'" t="inlineStr"><is><t xml:space="preserve">'.self::esc((string) $value).'</t></is></c>';
                }
            }
            $xml .= '</row>';
        }
        $xml .= '</sheetData>';

        if ($this->autoFilter) {
            $xml .= '<autoFilter ref="'.$this->autoFilter.'"/>';
        }
        if ($this->merges) {
            $xml .= '<mergeCells count="'.count($this->merges).'">';
            foreach ($this->merges as $m) {
                $xml .= '<mergeCell ref="'.$m.'"/>';
            }
            $xml .= '</mergeCells>';
        }

        $xml .= '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>'
            .'<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>'
            .'</worksheet>';

        return $xml;
    }

    private function stylesXml(): string
    {
        // fonts: 0 normal, 1 title, 2 bold, 3 bold white, 4 section (bold navy), 5 grey italic
        // fills: 0 none, 1 gray125 (required), 2 navy, 3 light gray
        // borders: 0 none, 1 thin all sides
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<fonts count="6">'
            .'<font><sz val="11"/><name val="Calibri"/></font>'
            .'<font><b/><sz val="16"/><color rgb="FF0F1E3D"/><name val="Calibri"/></font>'
            .'<font><b/><sz val="11"/><name val="Calibri"/></font>'
            .'<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'
            .'<font><b/><sz val="12"/><color rgb="FF1D4ED8"/><name val="Calibri"/></font>'
            .'<font><i/><sz val="10"/><color rgb="FF6B7280"/><name val="Calibri"/></font>'
            .'</fonts>'
            .'<fills count="4">'
            .'<fill><patternFill patternType="none"/></fill>'
            .'<fill><patternFill patternType="gray125"/></fill>'
            .'<fill><patternFill patternType="solid"><fgColor rgb="FF0F1E3D"/><bgColor indexed="64"/></patternFill></fill>'
            .'<fill><patternFill patternType="solid"><fgColor rgb="FFF3F4F6"/><bgColor indexed="64"/></patternFill></fill>'
            .'</fills>'
            .'<borders count="2">'
            .'<border><left/><right/><top/><bottom/><diagonal/></border>'
            .'<border><left style="thin"><color rgb="FFD1D5DB"/></left><right style="thin"><color rgb="FFD1D5DB"/></right>'
            .'<top style="thin"><color rgb="FFD1D5DB"/></top><bottom style="thin"><color rgb="FFD1D5DB"/></bottom><diagonal/></border>'
            .'</borders>'
            .'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            .'<cellXfs count="8">'
            .'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'                                                    // 0 default
            .'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center"/></xf>'     // 1 title
            .'<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>'                                      // 2 label
            .'<xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' // 3 header
            .'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' // 4 cell
            .'<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center"/></xf>'     // 5 section
            .'<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>'         // 6 total
            .'<xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1"/>'                                      // 7 subtitle
            .'</cellXfs>'
            .'<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
            .'</styleSheet>';
    }

    public static function ref(int $col, int $row): string
    {
        $letters = '';
        while ($col > 0) {
            $mod = ($col - 1) % 26;
            $letters = chr(65 + $mod).$letters;
            $col = intdiv($col - 1, 26);
        }
        return $letters.$row;
    }

    private static function absolute(string $range): string
    {
        return preg_replace('/([A-Z]+)(\d+)/', '\$$1\$$2', $range);
    }

    private static function esc(string $s): string
    {
        // strip characters that are invalid in XML 1.0
        $s = preg_replace('/[^\x{9}\x{A}\x{D}\x{20}-\x{D7FF}\x{E000}-\x{FFFD}]/u', '', $s) ?? '';
        return htmlspecialchars($s, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }
}
