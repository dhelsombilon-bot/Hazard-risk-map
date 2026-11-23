const STATUS_STYLES = {
  Compliant:       { bg: '#DCFCE7', text: '#166534' },
  Verified:        { bg: '#DCFCE7', text: '#166534' },
  'For review':    { bg: '#FEF9C3', text: '#854D0E' },
  'Needs review':  { bg: '#FEF9C3', text: '#854D0E' },
  Incomplete:      { bg: '#FEE2E2', text: '#991B1B' },
  'No permit record': { bg: '#F1F5F9', text: '#475569' },
  Active:          { bg: '#DCFCE7', text: '#166534' },
  Inactive:        { bg: '#F1F5F9', text: '#475569' },
  Open:            { bg: '#FEE2E2', text: '#991B1B' },
  Resolved:        { bg: '#DCFCE7', text: '#166534' },
  Pending:         { bg: '#FEF9C3', text: '#854D0E' },
  Verified:        { bg: '#DCFCE7', text: '#166534' },
  Missing:         { bg: '#FEE2E2', text: '#991B1B' },
}

export function statusStyle(status) {
  return STATUS_STYLES[status] || { bg: '#F1F5F9', text: '#475569' }
}
