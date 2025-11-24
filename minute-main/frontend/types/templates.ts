import {
  AgendaUsage,
  CreateQuestion,
  Question,
  TemplateType,
} from '@/lib/client'

export type Template = {
  id: string | null
  name: string
  agenda_usage: AgendaUsage
  service_domains?: string[] | null
}

export type TemplateData = {
  name: string
  content: string
  description: string
  type: TemplateType
  questions: (Question | CreateQuestion)[] | null
}
