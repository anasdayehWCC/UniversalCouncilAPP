'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listMinuteTasksMinutesMinuteIdTasksGetOptions,
  listMinuteTasksMinutesMinuteIdTasksGetQueryKey,
  createMinuteTaskMinutesMinuteIdTasksPostMutation,
  patchMinuteTaskMinutesMinuteIdTasksTaskIdPatchMutation,
  pushMinuteTasksMinutesMinuteIdTasksPushPostMutation,
} from '@/lib/client/@tanstack/react-query.gen'
import { MinuteTaskResponse, TaskStatus } from '@/lib/client'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@careminutes/ui'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, CheckSquare, Loader2, Plus, Send, Sparkles, TimerReset } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

const STATUS_OPTIONS: { label: string; value: TaskStatus }[] = [
  { label: 'To do', value: 'pending' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
]

const OWNER_ROLE_OPTIONS = [
  { label: 'Social worker', value: 'social_worker' },
  { label: 'Manager', value: 'manager' },
  { label: 'Parent / carer', value: 'parent' },
  { label: 'Health professional', value: 'health' },
  { label: 'Education', value: 'education' },
]

type CreateTaskForm = {
  description: string
  owner?: string
  owner_role?: string
  due_date?: string
  notes?: string
}

export function MinuteTasksPanel({ minuteId }: { minuteId: string }) {
  const queryClient = useQueryClient()
  const queryKey = listMinuteTasksMinutesMinuteIdTasksGetQueryKey({ path: { minute_id: minuteId } })
  const { data: tasks = [], isLoading } = useQuery({
    ...listMinuteTasksMinutesMinuteIdTasksGetOptions({ path: { minute_id: minuteId } }),
  })

  const openTasks = useMemo(() => tasks.filter((task) => task.status !== 'done').length, [tasks])

  const createTask = useMutation({
    ...createMinuteTaskMinutesMinuteIdTasksPostMutation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const updateTask = useMutation({
    ...patchMinuteTaskMinutesMinuteIdTasksTaskIdPatchMutation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const pushTasks = useMutation({
    ...pushMinuteTasksMinutesMinuteIdTasksPushPostMutation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const handleStatusChange = (task: MinuteTaskResponse, status: TaskStatus) => {
    updateTask.mutate(
      {
        path: { minute_id: minuteId, task_id: task.id! },
        body: { status },
      },
      {
        onSuccess: () => {
          toast.success('Task status updated')
        },
      }
    )
  }

  const handlePush = () => {
    pushTasks.mutate(
      { path: { minute_id: minuteId } },
      {
        onSuccess: (data) => {
          toast.success(
            data.pushed > 0 ? `Pushed ${data.pushed} task${data.pushed === 1 ? '' : 's'} to Planner` : 'All tasks already synced'
          )
        },
        onError: () => {
          toast.error('Unable to push tasks to Planner right now')
        },
      }
    )
  }

  return (
    <Card className="border border-slate-200/70 bg-white/70 shadow-sm backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold text-slate-800">Tasks</CardTitle>
          <p className="text-xs text-slate-500">{openTasks} open • {tasks.length} total</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={handlePush}
            disabled={pushTasks.isPending}
          >
            {pushTasks.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Push to Planner
          </Button>
          <AddTaskDialog
            onCreate={(payload) =>
              createTask.mutate(
                { path: { minute_id: minuteId }, body: payload },
                {
                  onSuccess: () => {
                    toast.success('Task added')
                  },
                }
              )
            }
            isSubmitting={createTask.isPending}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
            <Sparkles className="mx-auto mb-2 h-5 w-5 text-slate-400" />
            No task suggestions yet. Add one manually to capture follow-up actions.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <article
                key={task.id}
                className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-[0_1px_4px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{task.description}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {task.owner && <Badge variant="outline">{task.owner}</Badge>}
                      {task.due_date && (
                        <span className="inline-flex items-center gap-1">
                          <TimerReset className="h-3 w-3" /> {format(new Date(task.due_date), 'd MMM yyyy')}
                        </span>
                      )}
                      {task.planner_task_id && (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                          <CheckSquare className="mr-1 h-3 w-3" /> Planner
                        </Badge>
                      )}
                    </div>
                    {task.notes && <p className="mt-2 text-xs text-slate-500">{task.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Select
                      value={task.status}
                      onValueChange={(value) => handleStatusChange(task, value as TaskStatus)}
                    >
                      <SelectTrigger className="w-[140px] text-xs capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="capitalize">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {task.status !== 'done' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-emerald-600 hover:bg-emerald-50"
                        onClick={() => handleStatusChange(task, 'done')}
                        disabled={updateTask.isPending}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Mark done
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AddTaskDialog({
  onCreate,
  isSubmitting,
}: {
  onCreate: (payload: CreateTaskForm) => void
  isSubmitting: boolean
}) {
  const [open, setOpen] = useState(false)
  const form = useForm<CreateTaskForm>({
    defaultValues: {
      description: '',
      owner: 'Social worker',
      owner_role: 'social_worker',
    },
  })

  const handleSubmit = (values: CreateTaskForm) => {
    const payload: CreateTaskForm = {
      ...values,
      due_date: values.due_date ? new Date(values.due_date).toISOString() : undefined,
    }
    onCreate(payload)
    setOpen(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> Add task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add follow-up task</DialogTitle>
          <DialogDescription>Capture next steps before you forget them.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...form.register('description', { required: true })} placeholder="Speak to guardian" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input id="owner" {...form.register('owner')} placeholder="Social worker" />
            </div>
            <div className="space-y-2">
              <Label>Owner role</Label>
              <Controller
                control={form.control}
                name="owner_role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {OWNER_ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" type="date" {...form.register('due_date')} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} {...form.register('notes')} placeholder="Any extra context" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
