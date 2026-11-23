import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F3F6FA] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-black text-[#14254A] opacity-10 leading-none">404</div>
        <h1 className="text-2xl font-bold text-[#0F1E3D] mt-4">Page not found</h1>
        <p className="text-sm text-gray-500 mt-2 mb-6">The page you are looking for does not exist or has been moved.</p>
        <Link to="/"><Button>Return to Dashboard</Button></Link>
      </div>
    </div>
  )
}
