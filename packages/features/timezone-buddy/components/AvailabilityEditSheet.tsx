import { useForm, useFieldArray } from "react-hook-form";

import dayjs from "@calcom/dayjs";
import { DateOverrideInputDialog, DateOverrideList } from "@calcom/features/schedules";
import Schedule from "@calcom/features/schedules/components/Schedule";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import useMeQuery from "@calcom/trpc/react/hooks/useMeQuery";
import type { Schedule as ScheduleType, TimeRange, WorkingHours } from "@calcom/types/schedule";
import {
  Button,
  Form,
  Label,
  Sheet,
  SheetContent,
  SheetHeader,
  TopBanner,
  SheetTitle,
  TimezoneSelect,
} from "@calcom/ui";
import { Plus } from "@calcom/ui/components/icon";

import type { SliderUser } from "./AvailabilitySliderTable";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser?: SliderUser | null;
}

type AvailabilityFormValues = {
  name: string;
  schedule: ScheduleType;
  dateOverrides: { ranges: TimeRange[] }[];
  timeZone: string;
  isDefault: boolean;
};

const DateOverride = ({ workingHours }: { workingHours: WorkingHours[] }) => {
  const { remove, append, replace, fields } = useFieldArray<AvailabilityFormValues, "dateOverrides">({
    name: "dateOverrides",
  });
  const excludedDates = fields.map((field) => dayjs(field.ranges[0].start).utc().format("YYYY-MM-DD"));
  const { t } = useLocale();
  return (
    <div className="">
      <Label>{t("date_overrides")}</Label>
      <div className="space-y-2">
        <DateOverrideList
          excludedDates={excludedDates}
          remove={remove}
          replace={replace}
          items={fields}
          workingHours={workingHours}
        />
        <DateOverrideInputDialog
          workingHours={workingHours}
          excludedDates={excludedDates}
          onChange={(ranges) => ranges.forEach((range) => append({ ranges: [range] }))}
          Trigger={
            <Button color="secondary" StartIcon={Plus} data-testid="add-override">
              {t("add_an_override")}
            </Button>
          }
        />
      </div>
    </div>
  );
};

export function AvailabilityEditSheet(props: Props) {
  const userId = props.selectedUser?.id;
  const me = useMeQuery();
  const { t } = useLocale();

  const { data, isLoading } = trpc.viewer.availability.schedule.getScheduleByUserId.useQuery({
    userId: userId,
  });

  const form = useForm<AvailabilityFormValues>({
    values: data && {
      ...data,
      timeZone: data?.timeZone || me.data?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      schedule: data?.availability || [],
    },
  });

  const watchTimezone = form.watch("timeZone");

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <Form
        form={form}
        id="availability-form"
        handleSubmit={async ({ dateOverrides, ...values }) => {
          // scheduleId &&
          //   updateMutation.mutate({
          //     scheduleId,
          //     dateOverrides: dateOverrides.flatMap((override) => override.ranges),
          //     ...values,
          //   });
        }}>
        <SheetContent>
          {!data?.hasDefaultSchedule && !isLoading && (
            <div className="my-2">
              <TopBanner
                variant="warning"
                text="This user has not completed onboarding. You can set their default availaiblity for them below. "
              />
            </div>
          )}
          <SheetHeader>
            <SheetTitle>Edit Users Availability : {props.selectedUser?.username}</SheetTitle>
          </SheetHeader>

          <>
            <div>
              <Label className="text-emphasis">
                <>{t("timezone")}</>
              </Label>
              <TimezoneSelect
                id="timezone"
                value={watchTimezone ?? "Europe/London"}
                onChange={(event) => {
                  if (event) form.setValue("timeZone", event.value, { shouldDirty: true });
                }}
              />
            </div>
            <div className="mt-4">
              <Label className="text-emphasis">{t("members_default_schedule")}</Label>
              {/* Remove padding from schedule without touching the component */}
              <div className="[&>*:first-child]:!p-0">
                {typeof me.data?.weekStart === "string" && (
                  <Schedule
                    control={form.control}
                    name="schedule"
                    weekStart={
                      ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(
                        me.data?.weekStart
                      ) as 0 | 1 | 2 | 3 | 4 | 5 | 6
                    }
                  />
                )}
              </div>
            </div>
            <div className="mt-4">
              {data?.workingHours && <DateOverride workingHours={data.workingHours} />}
            </div>
          </>
        </SheetContent>
      </Form>
    </Sheet>
  );
}
