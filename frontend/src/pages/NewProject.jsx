import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, GitBranch, Rocket } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import PageWrapper from '../components/layout/PageWrapper'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { createProject, deployProject } from '../lib/api'

export default function NewProject() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', gitURL: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Project name is required'
    if (!form.gitURL.trim()) errs.gitURL = 'Git URL is required'
    else if (!form.gitURL.startsWith('https://')) errs.gitURL = 'Must be a valid https URL'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setApiError(null)
    try {
      const project = await createProject(form.name.trim(), form.gitURL.trim())
      const { deploymentId } = await deployProject(project.id)
      navigate(`/project/${project.id}/deploy/${deploymentId}`)
    } catch (err) {
      setApiError(err?.response?.data?.error || err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageWrapper className="max-w-lg mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
          <ArrowLeft size={15} />
          Back to projects
        </Link>

        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-lg bg-zinc-800 border border-surface-border">
              <GitBranch size={20} className="text-zinc-300" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-100 text-lg">Import Git Repository</h2>
              <p className="text-sm text-zinc-500">Deploy any public Git repository instantly</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Project Name"
              placeholder="my-awesome-app"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              error={errors.name}
            />
            <Input
              label="Git Repository URL"
              placeholder="https://github.com/user/repo"
              value={form.gitURL}
              onChange={e => setForm(f => ({ ...f, gitURL: e.target.value }))}
              error={errors.gitURL}
            />

            {apiError && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5">
                {typeof apiError === 'string' ? apiError : JSON.stringify(apiError)}
              </div>
            )}

            <Button type="submit" size="lg" className="mt-2 w-full" loading={loading}>
              <Rocket size={16} />
              {loading ? 'Deploying…' : 'Deploy Now'}
            </Button>
          </form>
        </Card>

        <p className="text-xs text-zinc-600 text-center mt-4">
          Deployment will start immediately after project creation.
        </p>
      </PageWrapper>
    </div>
  )
}
