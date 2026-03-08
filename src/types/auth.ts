export type TenantSummary = {
    tenant_id: string
    nome: string
    slug: string
    status: string
  }
  
  export type RoleSummary = {
    role_id: string
    name: string
    description: string | null
  }