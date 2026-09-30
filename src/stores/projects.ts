import { defineStore } from 'pinia'
import type {
  Employee,
  EmployeeInput,
  JobRadarEmployeeInput,
  JobRadarEmployeeView,
} from './employee.dto'
import { api } from '@/api'

export interface Client {
  id?: number | string
  first_name?: string
  last_name?: string
  company_name: string
}
export interface ProjectLocation {
  id?: number | string
  name: string
}
export interface Project {
  id: number
  title: string
  clients: Client[]
  locations: ProjectLocation[]
  kliemt_support_level: string
  clearing_point: 'no' | 'auto' | 'manual'
  clearing_point_email: string | null
  employee_self_service: string
  employees: Employee[]
  language: string | null
}

const initEmployee = (newEmployee: EmployeeInput): Employee => ({
  ...newEmployee,
  comments: '',
  termination_status: newEmployee.to_be_dismissed ? 'not-sent' : 'not-applicable',
  vlp_status: newEmployee.vlp_eligible ? 'pending' : 'not-eligible',
  vlp_contract: newEmployee.vlp_eligible ? 'not-sent' : 'not-applicable',
  winding_up_status: !newEmployee.to_be_dismissed
    ? 'not-applicable'
    : !newEmployee.winding_up
      ? 'no'
      : 'not-sent',
})
export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [] as Project[],
    jobRadarEmployees: {} as Record<number, JobRadarEmployeeView[]>,
  }),
  actions: {
    async loadProjects() {
      this.projects = (await api.get<Project[]>('projects')).map((project) => ({
        ...project,
        employees: [],
      }))
    },
    async loadProject(projectId: string) {
      const loadedProject = await api.get<Project>(`projects/${projectId}`)
      const projectIndex = this.projects.findIndex(({ id }) => id == parseInt(projectId))
      if (projectIndex !== -1) {
        this.projects.splice(projectIndex, 1, loadedProject)
      } else {
        this.projects.push(loadedProject)
      }
    },
    async addProject(project: Omit<Project, 'id'>) {
      const addedProject = await api.put<Project>(`projects`, {
        ...project,
        locations: project.locations.map(({ id, name }) => ({
          id: typeof id == 'number' ? id : undefined,
          name,
        })),
        clients: project.clients.map(({ id, company_name }) => ({
          id: typeof id == 'number' ? id : undefined,
          company_name,
        })),
        employees: project.employees.map((e) => initEmployee(e)),
      })
      this.projects.push(addedProject)
      return addedProject
    },
    async loadJobRadarEmployees(projectId: number) {
      this.jobRadarEmployees[projectId] = await api.get<JobRadarEmployeeView[]>(
        `job-radar/projects/${projectId}/employees`,
      )
    },
    async addJobRadarEmployee(projectId: number, payload: JobRadarEmployeeInput) {
      await api.post<JobRadarEmployeeView>(`job-radar/projects/${projectId}/employees`, payload)
      await this.loadJobRadarEmployees(projectId)
    },
    async deleteJobRadarEmployee(projectId: number, jobRadarEmployeeId: number) {
      await api.delete(`job-radar/employees/${jobRadarEmployeeId}`)
      await this.loadJobRadarEmployees(projectId)
    },
    async updateEmployee(employee: Employee) {
      return api.patch<Project>(`employees/${employee.id}`, employee)
    },
    async getToken(employee: Employee) {
      return api.get(`employees/${employee.id}/token`, { responseAs: 'text' })
    },
    async exportEmployeeUrls(projectId: number) {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/employees/project/${projectId}/export-urls`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `employee-urls-project-${projectId}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
  },
})
