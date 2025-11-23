'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@careminutes/ui'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { GetUserResponse } from '@/lib/client'
import {
  getUserUsersMeGetOptions,
  getUserUsersMeGetQueryKey,
  updateDataRetentionUsersDataRetentionPatchMutation,
} from '@/lib/client/@tanstack/react-query.gen'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Loader, Loader2, TriangleAlert, Settings2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { motion } from 'framer-motion'

type UserSettingsForm = { dataRetention: 'none' | `${number}` }

export default function SettingsPage() {
  const { data: user } = useQuery({ ...getUserUsersMeGetOptions() })
  const router = useRouter()

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto flex max-w-4xl items-center justify-center gap-3 pt-12"
      >
        <Loader2 className="animate-spin h-6 w-6 text-primary" />
        <span className="text-lg text-muted-foreground">Loading settings...</span>
      </motion.div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-8 py-12">
      <Button
        variant="link"
        className="mb-8 self-start px-0 underline hover:decoration-2 text-muted-foreground hover:text-foreground"
        onClick={() => {
          router.back()
        }}
      >
        <span className="flex items-center">
          <ChevronLeft />
          Back
        </span>
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Settings2 className="h-7 w-7" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Settings</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Configure your account preferences and data retention policies
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <SettingsForm user={user} />
      </motion.div>
    </div>
  )
}

function SettingsForm({ user }: { user: GetUserResponse }) {
  const form = useForm<UserSettingsForm>({
    defaultValues: {
      dataRetention: user.data_retention_days
        ? `${user.data_retention_days}`
        : 'none',
    },
  })
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    ...updateDataRetentionUsersDataRetentionPatchMutation(),
  })

  const onSubmit = useCallback(
    async (data: UserSettingsForm) => {
      await mutateAsync(
        {
          body: {
            data_retention_days:
              data.dataRetention === 'none' ? null : Number(data.dataRetention),
          },
        },
        {
          onSuccess() {
            queryClient.invalidateQueries({
              queryKey: getUserUsersMeGetQueryKey(),
            })
          },
        }
      )
    },
    [mutateAsync, queryClient]
  )

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      <div className="rounded-2xl border-2 border-border/50 p-8 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 shadow-md">
        <Label htmlFor="dataRetention" className="text-xl font-semibold mb-3 block">
          Data Retention Period
        </Label>
        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
          After this period the transcriptions, minutes and audio recording will
          be permanently deleted. This helps ensure compliance with data protection regulations.
        </p>

        {user.strict_data_retention && (
          <Alert className="my-4 border-amber-300 bg-amber-50">
            <TriangleAlert className="text-amber-600" />
            <AlertTitle className="text-amber-900">Your retention period cannot be changed</AlertTitle>
            <AlertDescription className="text-amber-800">
              Due to your organisation&apos;s retention policy you cannot adjust
              your data retention preferences. Transcripts and summaries will be
              kept for 24 hours.
            </AlertDescription>
          </Alert>
        )}

        <Controller
          disabled={user.strict_data_retention}
          control={form.control}
          name="dataRetention"
          render={({ field: { onChange, value, ref, disabled } }) => (
            <RadioGroup
              value={user.strict_data_retention ? '1' : value}
              onValueChange={onChange}
              disabled={disabled}
              ref={ref}
              className="gap-3"
            >
              <Label className="flex items-center gap-3 p-4 rounded-xl border border-border/50 hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer">
                <RadioGroupItem value="none" />
                <div>
                  <div className="font-medium">Keep indefinitely</div>
                  <div className="text-xs text-muted-foreground">No automatic deletion</div>
                </div>
              </Label>
              <Label className="flex items-center gap-3 p-4 rounded-xl border border-border/50 hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer">
                <RadioGroupItem value="1" />
                <div>
                  <div className="font-medium">1 day</div>
                  <div className="text-xs text-muted-foreground">Deleted after 24 hours</div>
                </div>
              </Label>
              <Label className="flex items-center gap-3 p-4 rounded-xl border border-border/50 hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer">
                <RadioGroupItem value="7" />
                <div>
                  <div className="font-medium">7 days</div>
                  <div className="text-xs text-muted-foreground">Deleted after one week</div>
                </div>
              </Label>
              <Label className="flex items-center gap-3 p-4 rounded-xl border border-border/50 hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer">
                <RadioGroupItem value="30" />
                <div>
                  <div className="font-medium">30 days</div>
                  <div className="text-xs text-muted-foreground">Deleted after one month</div>
                </div>
              </Label>
              <Label className="flex items-center gap-3 p-4 rounded-xl border border-border/50 hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer">
                <RadioGroupItem value="90" />
                <div>
                  <div className="font-medium">90 days</div>
                  <div className="text-xs text-muted-foreground">Deleted after three months</div>
                </div>
              </Label>
            </RadioGroup>
          )}
        />
      </div>

      <div>
        <Button
          disabled={user.strict_data_retention}
          type="submit"
          className="bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all px-8 py-6 text-base font-semibold"
        >
          {isPending ? (
            <>
              <Loader className="animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </form>
  )
}
