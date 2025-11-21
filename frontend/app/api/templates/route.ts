import { NextResponse } from 'next/server'

export async function GET() {
  // Mock templates data
  const templates = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Social Care Assessment',
      description: 'Standard assessment template',
      agenda_usage: 'required',
      structure: {}
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Home Visit',
      description: 'Routine home visit record',
      agenda_usage: 'optional',
      structure: {}
    }
  ]
  
  return NextResponse.json(templates)
}
