import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[#F3F6FA] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-black text-[#14254A] opacity-10 leading-none">403</div>
        <h1 className="text-2xl font-bold text-[#0F1E3D] mt-4">Access denied</h1>
        <p className="text-sm text-gray-500 mt-2 mb-6">You do not have permission to access this page.</p>
        <Link to="/"><Button>Return to Dashboard</Button></Link>
      </div>
    </div>
  )
}
