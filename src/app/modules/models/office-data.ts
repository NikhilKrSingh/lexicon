export const WORKING_HOURS: Array<IWorkingHours> = [
  { value: '00', key: 'Closed' },
  { value: '01:00:00', key: '1:00 AM' },
  { value: '01:30:00', key: '1:30 AM' },
  { value: '02:00:00', key: '2:00 AM' },
  { value: '02:30:00', key: '2:30 AM' },
  { value: '03:00:00', key: '3:00 AM' },
  { value: '03:30:00', key: '3:30 AM' },
  { value: '04:00:00', key: '4:00 AM' },
  { value: '04:30:00', key: '4:30 AM' },
  { value: '05:00:00', key: '5:00 AM' },
  { value: '05:30:00', key: '5:30 AM' },
  { value: '06:00:00', key: '6:00 AM' },
  { value: '06:30:00', key: '6:30 AM' },
  { value: '07:00:00', key: '7:00 AM' },
  { value: '07:30:00', key: '7:30 AM' },
  { value: '08:00:00', key: '8:00 AM' },
  { value: '08:30:00', key: '8:30 AM' },
  { value: '09:00:00', key: '9:00 AM' },
  { value: '09:30:00', key: '9:30 AM' },
  { value: '10:00:00', key: '10:00 AM' },
  { value: '10:30:00', key: '10:30 AM' },
  { value: '11:00:00', key: '11:00 AM' },
  { value: '11:30:00', key: '11:30 AM' },
  { value: '12:00:00', key: '12:00 PM' },
  { value: '12:30:00', key: '12:30 PM' },
  { value: '13:00:00', key: '1:00 PM' },
  { value: '13:30:00', key: '1:30 PM' },
  { value: '14:00:00', key: '2:00 PM' },
  { value: '14:30:00', key: '2:30 PM' },
  { value: '15:00:00', key: '3:00 PM' },
  { value: '15:30:00', key: '3:30 PM' },
  { value: '16:00:00', key: '4:00 PM' },
  { value: '16:30:00', key: '4:30 PM' },
  { value: '17:00:00', key: '5:00 PM' },
  { value: '17:30:00', key: '5:30 PM' },
  { value: '18:00:00', key: '6:00 PM' },
  { value: '18:30:00', key: '6:30 PM' },
  { value: '19:00:00', key: '7:00 PM' },
  { value: '19:30:00', key: '7:30 PM' },
  { value: '20:00:00', key: '8:00 PM' },
  { value: '20:30:00', key: '8:30 PM' },
  { value: '21:00:00', key: '9:00 PM' },
  { value: '21:30:00', key: '9:30 PM' },
  { value: '22:00:00', key: '10:00 PM' },
  { value: '22:30:00', key: '10:30 PM' },
  { value: '23:00:00', key: '11:00 PM' },
  { value: '23:30:00', key: '11:30 PM' },
  { value: '24:00:00', key: '12:00 AM' },
  { value: '24:30:00', key: '12:30 AM' }
];

export interface IWorkingHours {
  value?: string;
  key?: string;
  index?: number;
}

export interface IWorkingDay {
  index?: number;
  name: string;
  open: string;
  close: string;
  isCustom?: boolean;
  openDisplay?: string;
  closeDisplay?: string;
}

export const WORKING_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export function getWorkingHour(day: string) {
  return {
    open: `${day.toLowerCase()}OpenHours`,
    close: `${day.toLowerCase()}CloseHours`
  };
}


export class ICustomizeHoursResponse {
  workingHours: Array<IWorkingDay>;
  changeNotes: string;
}

export const scheduling_Hours = [
  { value: '07:00:00', key: '7:00 AM' },
  { value: '07:30:00', key: '7:30 AM' },
  { value: '08:00:00', key: '8:00 AM' },
  { value: '08:30:00', key: '8:30 AM' },
  { value: '09:00:00', key: '9:00 AM' },
  { value: '09:30:00', key: '9:30 AM' },
  { value: '10:00:00', key: '10:00 AM' },
  { value: '10:30:00', key: '10:30 AM' },
  { value: '11:00:00', key: '11:00 AM' },
  { value: '11:30:00', key: '11:30 AM' },
  { value: '12:00:00', key: '12:00 PM' },
  { value: '12:30:00', key: '12:30 PM' },
  { value: '13:00:00', key: '1:00 PM' },
  { value: '13:30:00', key: '1:30 PM' },
  { value: '14:00:00', key: '2:00 PM' },
  { value: '14:30:00', key: '2:30 PM' },
  { value: '15:00:00', key: '3:00 PM' },
  { value: '15:30:00', key: '3:30 PM' },
  { value: '16:00:00', key: '4:00 PM' },
  { value: '16:30:00', key: '4:30 PM' },
  { value: '17:00:00', key: '5:00 PM' },
  { value: '17:30:00', key: '5:30 PM' },
  { value: '18:00:00', key: '6:00 PM' },
  { value: '18:30:00', key: '6:30 PM' },
  { value: '19:00:00', key: '7:00 PM' },
]