'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listTasksTasksGetOptions,
  listTasksTasksGetQueryKey,
  patchMinuteTaskMinutesMinuteIdTasksTaskIdPatchMutation,
} from '@/lib/client/@tanstack/react-query.gen'
import { MinuteTaskListItemResponse, TaskStatus } from '@/lib/client'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@careminutes/ui'
import Link from 'next/link'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { CheckCircle2, ClipboardList, Loader2 } from 'lucide-react'

const FILTERS: { label: string; value: TaskStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'To do', value: 'pending' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
]

export default function TasksPage() {
  const [filter, setFilter] = useState<TaskStatus | 'all'>('pending')
  const queryClient = useQueryClient()
  const queryKey = listTasksTasksGetQueryKey()
  const { data: tasks = [], isLoading } = useQuery({ ...listTasksTasksGetOptions() })

  const updateTask = useMutation({
    ...patchMinuteTaskMinutesMinuteIdTasksTaskIdPatchMutation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks
    return tasks.filter((task) => task.status === filter)
  }, [tasks, filter])

  const openTasks = useMemo(() => tasks.filter((task) => task.status !== 'done').length, [tasks])
  const doneTasks = useMemo(() => tasks.filter((task) => task.status === 'done').length, [tasks])

  const handleStatusUpdate = (task: MinuteTaskListItemResponse, status: TaskStatus) => {
    updateTask.mutate(
      { path: { minute_id: task.minute_id!, task_id: task.id! }, body: { status } },
      {
        onSuccess: () => toast.success('Task updated'),
      }
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My tasks</h1>
        <p className="text-sm text-slate-500">Actions captured across your minutes and exports.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader>
            <CardTitle className="text-sm text-slate-600">Open tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">{openTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-600">Completed this week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">{doneTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-600">Total captured</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">{tasks.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as TaskStatus | 'all')}>
        <TabsList className="flex flex-wrap justify-start gap-2">
          {FILTERS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="capitalize">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={filter} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <Card className="border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
              <ClipboardList className="mx-auto mb-2 h-6 w-6 text-slate-400" />
              <p className="text-sm text-slate-500">Nothing to show for this filter right now.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="border border-slate-200/70 bg-white/90 shadow-sm">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm font-semibold text-slate-900">{task.description}</p>
                        {task.case_reference && (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                            Case {task.case_reference}
                          </Badge>
                        )}
                        {task.template_name && (
                          <Badge variant="outline">{task.template_name}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {task.owner && <span className="mr-3">Owner: {task.owner}</span>}
                        {task.due_date && <span>Due {format(new Date(task.due_date), 'd MMM')}</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {task.transcription_id && (
                        <Link
                          href={`/transcriptions/${task.transcription_id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Open minute
                        </Link>
                      )}
                      {task.status !== 'done' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-emerald-600 hover:bg-emerald-50"
                          onClick={() => handleStatusUpdate(task, 'done')}
                          disabled={updateTask.isPending}
                        >
                          {updateTask.isPending ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                          )}
                          Mark done
                        </Button>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-700">Completed</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
