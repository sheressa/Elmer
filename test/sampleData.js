var moment = require('moment');

var wiwUserObject = { 
  id: 5674723,
  account_id: 549781,
  login_id: 2761909,
  timezone_id: 0,
  country_id: 233,
  migration_id: 0,
  role: 3,
  is_payroll: false,
  is_trusted: 0,
  type: 1,
  email: 'amudantest@test.com',
  first_name: 'Amudan',
  last_name: 'Test',
  phone_number: '',
  employee_code: '',
  avatar:
   { url: 'https://avatars.wheniwork.com/dc02824b2af4ac232129a41fc376c77cc2ea3d5f/%s',
     size: '%s' },
  password: true,
  activated: true,
  is_hidden: false,
  uuid: '88ffabdddf9bb82r144f4476eacd3064f664dc0f',
  notes: '',
  affiliate: 0,
  is_private: true,
  infotips: '',
  hours_preferred: 0,
  hours_max: 40,
  hourly_rate: 0,
  alert_settings:
   { timeoff: { sms: false, email: false },
     swaps: { sms: false, email: false },
     schedule: { sms: false, email: false },
     reminders: { sms: true, email: true },
     availability: { sms: false, email: false },
     new_employee: { sms: false, email: false },
     attendance: { sms: false, email: false } },
  reminder_time: 1,
  sleep_start: '23:00:00',
  sleep_end: '05:00:00',
  my_positions: [],
  last_login: 'Mon, 25 Jan 2016 21:30:38 -0500',
  dismissed_at: '',
  notified_at: 'Tue, 29 Nov -001 19:00:00 -0500',
  created_at: 'Tue, 19 Jan 2016 14:48:09 -0500',
  updated_at: 'Mon, 25 Jan 2016 21:32:47 -0500',
  is_deleted: false,
  login_email: 'amudantest@test.com',
  timezone_name: 'America/New_York',
  positions: [],
  locations: [ 1003762, 1003765 ],
  position_rates: [],
  position_quality: [],
  sort: { '1003762': 0, '1003765': 0 } 
};

var wiwShiftObject =
{
  shifts:
   [ { id: 284947012,
       account_id: 549781,
       user_id: 5674723,
       location_id: 1003765,
       position_id: 0,
       site_id: 0,
       start_time: 'Mon, 01 Feb 2016 12:00:00 -0500',
       end_time: 'Mon, 01 Feb 2016 14:00:00 -0500',
       break_time: 0,
       color: 'cccccc',
       notes: '{"original_owner":5674723, "parent_shift":277119037}',
       alerted: false,
       linked_users: null,
       shiftchain_key: '4kzmf1',
       published: true,
       published_date: 'Mon, 25 Jan 2016 09:42:28 -0500',
       notified_at: 'Tue, 29 Nov -001 19:00:00 -0500',
       instances: 1,
       created_at: 'Mon, 18 Jan 2016 08:52:20 -0500',
       updated_at: 'Mon, 25 Jan 2016 09:42:28 -0500',
       acknowledged: 1,
       acknowledged_at: '',
       creator_id: 5005069,
       is_open: false,
       actionable: false,
       block_id: 0 },
     { id: 277119037,
       account_id: 549781,
       user_id: 5674723,
       location_id: 1003765,
       position_id: 0,
       site_id: 0,
       start_time: 'Mon, 25 Jan 2016 12:00:00 -0500',
       end_time: 'Mon, 25 Jan 2016 14:00:00 -0500',
       break_time: 0,
       color: 'cccccc',
       notes: '{"original_owner":5674723, "parent_shift":277119037}',
       alerted: true,
       linked_users: null,
       shiftchain_key: '4kzmf1',
       published: true,
       published_date: 'Mon, 18 Jan 2016 08:52:23 -0500',
       notified_at: 'Tue, 29 Nov -001 19:00:00 -0500',
       instances: 0,
       created_at: 'Mon, 18 Jan 2016 08:52:20 -0500',
       updated_at: 'Mon, 25 Jan 2016 10:09:10 -0500',
       acknowledged: 1,
       acknowledged_at: '',
       creator_id: 5005069,
       is_open: false,
       actionable: false,
       block_id: 0 },
     { id: 277119256,
       account_id: 549781,
       user_id: 5674723,
       location_id: 1003765,
       position_id: 0,
       site_id: 0,
       start_time: 'Mon, 25 Jan 2016 14:00:00 -0500',
       end_time: 'Mon, 25 Jan 2016 16:00:00 -0500',
       break_time: 0,
       color: 'cccccc',
       notes: '{"original_owner":5674723, "parent_shift":277119256}',
       alerted: true,
       linked_users: null,
       shiftchain_key: '4kzml4',
       published: true,
       published_date: 'Mon, 18 Jan 2016 08:52:23 -0500',
       notified_at: 'Tue, 29 Nov -001 19:00:00 -0500',
       instances: 0,
       created_at: 'Mon, 18 Jan 2016 08:52:20 -0500',
       updated_at: 'Mon, 25 Jan 2016 12:08:06 -0500',
       acknowledged: 1,
       acknowledged_at: '',
       creator_id: 5005069,
       is_open: false,
       actionable: false,
       block_id: 0 },
     { id: 281883880,
       account_id: 549781,
       user_id: 5674723,
       location_id: 1003762,
       position_id: 0,
       site_id: 0,
       start_time: 'Thu, 28 Jan 2016 16:00:00 -0500',
       end_time: 'Thu, 28 Jan 2016 18:00:00 -0500',
       break_time: 0,
       color: 'cccccc',
       notes: '{"original_owner":5674723, "parent_shift":281883880}',
       alerted: false,
       linked_users: null,
       shiftchain_key: '4ntqzs',
       published: true,
       published_date: 'Mon, 18 Jan 2016 08:52:24 -0500',
       notified_at: 'Tue, 29 Nov -001 19:00:00 -0500',
       instances: 0,
       created_at: 'Mon, 18 Jan 2016 08:52:20 -0500',
       updated_at: 'Wed, 20 Jan 2016 20:30:09 -0500',
       acknowledged: 1,
       acknowledged_at: '',
       creator_id: 5005069,
       is_open: false,
       actionable: false,
       block_id: 0 },
     { id: 281883643,
       account_id: 549781,
       user_id: 5674723,
       location_id: 1003762,
       position_id: 0,
       site_id: 0,
       start_time: 'Thu, 28 Jan 2016 14:00:00 -0500',
       end_time: 'Thu, 28 Jan 2016 16:00:00 -0500',
       break_time: 0,
       color: 'cccccc',
       notes: '{"original_owner":5674723, "parent_shift":281883643}',
       alerted: false,
       linked_users: null,
       shiftchain_key: '4ntqt7',
       published: true,
       published_date: 'Mon, 18 Jan 2016 08:52:24 -0500',
       notified_at: 'Tue, 29 Nov -001 19:00:00 -0500',
       instances: 0,
       created_at: 'Mon, 18 Jan 2016 08:52:20 -0500',
       updated_at: 'Wed, 20 Jan 2016 20:30:05 -0500',
       acknowledged: 1,
       acknowledged_at: '',
       creator_id: 5005069,
       is_open: false,
       actionable: false,
       block_id: 0 },
     { id: 284948059,
       account_id: 549781,
       user_id: 5674723,
       location_id: 1003765,
       position_id: 0,
       site_id: 0,
       start_time: 'Mon, 01 Feb 2016 14:00:00 -0500',
       end_time: 'Mon, 01 Feb 2016 16:00:00 -0500',
       break_time: 0,
       color: 'cccccc',
       notes: '{"original_owner":5674723, "parent_shift":277119256}',
       alerted: false,
       linked_users: null,
       shiftchain_key: '4kzml4',
       published: true,
       published_date: 'Mon, 25 Jan 2016 09:43:28 -0500',
       notified_at: 'Tue, 29 Nov -001 19:00:00 -0500',
       instances: 1,
       created_at: 'Mon, 18 Jan 2016 08:52:20 -0500',
       updated_at: 'Mon, 25 Jan 2016 09:43:28 -0500',
       acknowledged: 1,
       acknowledged_at: '',
       creator_id: 5005069,
       is_open: false,
       actionable: false,
       block_id: 0 },
    { id: 284948049,
       account_id: 549781,
       user_id: 5674723,
       location_id: 1003762,
       position_id: 0,
       site_id: 0,
       start_time: 'Mon, 01 Feb 2016 14:00:00 -0500',
       end_time: 'Mon, 01 Feb 2016 16:00:00 -0500',
       break_time: 0,
       color: 'cccccc',
       notes: '{"original_owner":5674723, "parent_shift":277119256}',
       alerted: false,
       linked_users: null,
       shiftchain_key: '4kzml4',
       published: true,
       published_date: 'Mon, 25 Jan 2016 09:43:28 -0500',
       notified_at: 'Tue, 29 Nov -001 19:00:00 -0500',
       instances: 1,
       created_at: 'Mon, 18 Jan 2016 08:52:20 -0500',
       updated_at: 'Mon, 25 Jan 2016 09:43:28 -0500',
       acknowledged: 1,
       acknowledged_at: '',
       creator_id: 5005069,
       is_open: true,
       actionable: false,
       block_id: 0 },
    { id: 284948019,
       account_id: 549781,
       user_id: 5674723,
       location_id: 1003762,
       position_id: 0,
       site_id: 0,
       start_time: 'Mon, 01 Feb 2016 14:00:00 -0500',
       end_time: 'Mon, 01 Feb 2016 16:00:00 -0500',
       break_time: 0,
       color: 'cccccc',
       notes: '{"original_owner":5674723, "parent_shift":277119256}',
       alerted: false,
       linked_users: null,
       shiftchain_key: '4kzml4',
       published: true,
       published_date: 'Mon, 25 Jan 2016 09:43:28 -0500',
       notified_at: 'Tue, 29 Nov -001 19:00:00 -0500',
       instances: 1,
       created_at: 'Mon, 18 Jan 2016 08:52:20 -0500',
       updated_at: 'Mon, 25 Jan 2016 09:43:28 -0500',
       acknowledged: 1,
       acknowledged_at: '',
       creator_id: 5005069,
       is_open: true,
       actionable: false,
       block_id: 0 },
    { id: 284948039,
       account_id: 549781,
       user_id: 5674724,
       location_id: 1003765,
       position_id: 0,
       site_id: 0,
       start_time: 'Mon, 01 Feb 2016 16:00:00 -0500',
       end_time: 'Mon, 01 Feb 2016 18:00:00 -0500',
       break_time: 0,
       color: 'cccccc',
       notes: '{"original_owner":5674723, "parent_shift":277119256}',
       alerted: false,
       linked_users: null,
       shiftchain_key: '4kzml4',
       published: true,
       published_date: 'Mon, 25 Jan 2016 09:43:28 -0500',
       notified_at: 'Tue, 29 Nov -001 19:00:00 -0500',
       instances: 1,
       created_at: 'Mon, 18 Jan 2016 08:52:20 -0500',
       updated_at: 'Mon, 25 Jan 2016 09:43:28 -0500',
       acknowledged: 1,
       acknowledged_at: '',
       creator_id: 5005069,
       is_open: true,
       actionable: false,
       block_id: 0 },
    { id: 284948029,
       account_id: 549781,
       user_id: 5674724,
       location_id: 1003765,
       position_id: 0,
       site_id: 0,
       start_time: 'Mon, 01 Feb 2016 16:00:00 -0500',
       end_time: 'Mon, 01 Feb 2016 18:00:00 -0500',
       break_time: 0,
       color: 'cccccc',
       notes: '{"original_owner":5674723, "parent_shift":277119256}',
       alerted: false,
       linked_users: null,
       shiftchain_key: '4kzml4',
       published: true,
       published_date: 'Mon, 25 Jan 2016 09:43:28 -0500',
       notified_at: 'Tue, 29 Nov -001 19:00:00 -0500',
       instances: 1,
       created_at: 'Mon, 18 Jan 2016 08:52:20 -0500',
       updated_at: 'Mon, 25 Jan 2016 09:43:28 -0500',
       acknowledged: 1,
       acknowledged_at: '',
       creator_id: 5005069,
       is_open: true,
       actionable: false,
       block_id: 0 },
      { id: 284948099,
       account_id: 549781,
       user_id: 5674794,
       location_id: 1003777,
       position_id: 0,
       site_id: 0,
       start_time: 'Tue, 02 Feb 2016 16:00:00 -0500',
       end_time: 'Tue, 02 Feb 2016 18:00:00 -0500',
       break_time: 0,
       color: 'cccccc',
       notes: '',
       alerted: false,
       linked_users: null,
       shiftchain_key: '4kzml4',
       published: false,
       published_date: 'Mon, 25 Jan 2016 09:43:28 -0500',
       notified_at: 'Tue, 29 Nov -001 19:00:00 -0500',
       instances: 1,
       created_at: 'Mon, 18 Jan 2016 08:52:20 -0500',
       updated_at: 'Mon, 25 Jan 2016 09:43:28 -0500',
       acknowledged: 1,
       acknowledged_at: '',
       creator_id: 5005069,
       is_open: true,
       actionable: false,
       block_id: 0 } ],
};

// These are used in the return for wiwRequestObject
var requests1 = [
  {
    "id": 15013506,
    "account_id": 549781,
    "user_id": 5701549,
    "creator_id": 5701549,
    "updater_id": 7889841,
    "status": 2,
    "type": 0,
    "hours": 0,
    "start_time": "Fri, 10 Jun 2016 00:00:00 -0400",
    "end_time": "Sun, 12 Jun 2016 23:59:59 -0400",
    "created_at": "Thu, 09 Jun 2016 09:46:55 -0400",
    "updated_at": "Thu, 09 Jun 2016 09:50:00 -0400",
    "canceled_by": 0
  },
  {
    "id": 14790451,
    "account_id": 549781,
    "user_id": 5660404,
    "creator_id": 5660404,
    "updater_id": 5005069,
    "status": 0,
    "type": 0,
    "hours": 0,
    "start_time": "Mon, 06 Jun 2016 00:00:00 -0400",
    "end_time": "Fri, 10 Jun 2016 23:59:59 -0400",
    "created_at": "Sun, 05 Jun 2016 21:31:41 -0400",
    "updated_at": "Sun, 05 Jun 2016 21:35:01 -0400",
    "canceled_by": 0
  },
  {
    "id": 15013196,
    "account_id": 549781,
    "user_id": 5659612,
    "creator_id": 5659612,
    "updater_id": 7889841,
    "status": 2,
    "type": 0,
    "hours": 0,
    "start_time": "Mon, 13 Jun 2016 00:00:00 -0400",
    "end_time": "Mon, 13 Jun 2016 23:59:59 -0400",
    "created_at": "Thu, 09 Jun 2016 09:40:58 -0400",
    "updated_at": "Thu, 09 Jun 2016 09:45:00 -0400",
    "canceled_by": 0
  },
  {
    "id": 15013196,
    "account_id": 549781,
    "user_id": 5659612,
    "creator_id": 5659612,
    "updater_id": 7889841,
    "status": 0,
    "type": 0,
    "hours": 0,
    "start_time": "Mon, 13 Jun 2016 00:00:00 -0400",
    "end_time": "Mon, 13 Jun 2016 23:59:59 -0400",
    "created_at": "Thu, 09 Jun 2016 09:40:58 -0400",
    "updated_at": "Thu, 09 Jun 2016 09:45:00 -0400",
    "canceled_by": 0
  },
  {
    "id": 15013196,
    "account_id": 549781,
    "user_id": 5659612,
    "creator_id": 5659612,
    "updater_id": 7889841,
    "status": 1,
    "type": 0,
    "hours": 0,
    "start_time": "Mon, 13 Jun 2016 00:00:00 -0400",
    "end_time": "Mon, 13 Jun 2016 23:59:59 -0400",
    "created_at": "Thu, 09 Jun 2016 09:40:58 -0400",
    "updated_at": "Thu, 09 Jun 2016 09:45:00 -0400",
    "canceled_by": 0
  }
];

// This is how the return from a WiW get request for 'requests' should look
var wiwRequestsObject = {
  // Example message object currently unused
  "messages": [
    {
      id: 31250596,
      account_id: 549781,
      user_id: 5692804,
      request_id: 14564851,
      swap_id: 0,
      conversation_id: 0,
      type: 0,
      title: "",
      content: "I scheduled a make-up shift on the wrong day, sorry.",
      created_at: "Wed, 01 Jun 2016 18:59:58 -0400",
      updated_at: "Wed, 01 Jun 2016 18:59:58 -0400"
    }
  ],
  "start": "Thu, 09 Jun 2016 10:55:59 -0400",
  "end": "Fri, 09 Dec 2016 10:55:59 -0500",
  "total": 461,
  "page": 0,
  // Important Part "status": 2 (approved), 1 (denied), 0 (pending)
  "requests": requests1,
  // Example user object currently unused
  "users": [
    {
      "id": 5376436,
      "account_id": 549781,
      "login_id": 2588281,
      "timezone_id": 9,
      "country_id": 233,
      "migration_id": 0,
      "role": 3,
      "is_payroll": false,
      "is_trusted": 0,
      "type": 1,
      "email": "brenbland@gmail.com",
      "first_name": "Brenda",
      "last_name": "Kuhn",
      "phone_number": "+17196616289",
      "employee_code": "",
      "avatar": {
        "url": "https://avatars.wheniwork.com/b52c5356097db5d81f3ff87eb07ad0d99082f866/%s",
        "size": "%s"
      },
      "password": true,
      "activated": true,
      "is_hidden": false,
      "uuid": "fa3783bba377b3d23b2ea68795843a8b86e6bfd9",
      "notes": "{\"canonicalEmail\":\"brenbland@gmail.com\",\"timezoneSet\":true}",
      "affiliate": 0,
      "is_private": false,
      "infotips": "",
      "hours_preferred": 0,
      "hours_max": 40,
      "hourly_rate": 0,
      "alert_settings": {
        "timeoff": {
          "sms": true,
          "email": false
        },
        "swaps": {
          "sms": true,
          "email": false
        },
        "schedule": {
          "sms": true,
          "email": false
        },
        "reminders": {
          "sms": true,
          "email": false
        },
        "availability": {
          "sms": false,
          "email": false
        },
        "new_employee": {
          "sms": false,
          "email": false
        },
        "attendance": {
          "sms": false,
          "email": false
        },
        "workchat": {
          "alerts": true,
          "badge_icon": true,
          "in_app": true
        }
      },
      "reminder_time": 2,
      "sleep_start": "04:00:00",
      "sleep_end": "12:00:00",
      "my_positions": [],
      "last_login": "Sat, 04 Jun 2016 14:31:51 -0400",
      "dismissed_at": "",
      "notified_at": "Sat, 23 Jan 2016 20:26:36 -0500",
      "created_at": "Sat, 19 Dec 2015 16:36:31 -0500",
      "updated_at": "Sat, 04 Jun 2016 14:31:51 -0400",
      "deleted_at": "",
      "is_deleted": false,
      "timezone_name": "America/New_York",
      "positions": [],
      "locations": [
        1003762,
        1003765
      ],
      "position_rates": [],
      "position_quality": [],
      "sort": {
        "1003762": 0,
        "1003765": 0
      }
    }
  ]
};

var wiwUsersObject = {
  users: [
  { id: 5674723,
    account_id: 549781,
    login_id: 2761909,
    timezone_id: 0,
    country_id: 233,
    migration_id: 0,
    role: 3,
    is_payroll: false,
    is_trusted: 0,
    type: 1,
    email: 'john+test@crisistextline.org',
    first_name: 'Amudan',
    last_name: 'Test',
    phone_number: '',
    employee_code: '',
    avatar:
     { url: 'https://avatars.wheniwork.com/dc02824b2af4ac232129a41fc376c77cc2ea3d5f/%s',
       size: '%s' },
    password: true,
    activated: true,
    is_hidden: false,
    uuid: '88ffabdddf9bb82r144f4476eacd3064f664dc0f',
    notes: '{"original_owner":5674723, "parent_shift":277119256}',
    affiliate: 0,
    is_private: true,
    infotips: '',
    hours_preferred: 0,
    hours_max: 40,
    hourly_rate: 0,
    alert_settings:
     { timeoff: { sms: false, email: false },
       swaps: { sms: false, email: false },
       schedule: { sms: false, email: false },
       reminders: { sms: true, email: true },
       availability: { sms: false, email: false },
       new_employee: { sms: false, email: false },
       attendance: { sms: false, email: false } },
    reminder_time: 1,
    sleep_start: '23:00:00',
    sleep_end: '05:00:00',
    my_positions: [],
    last_login: 'Mon, 25 Jan 2016 21:30:38 -0500',
    dismissed_at: '',
    notified_at: 'Tue, 29 Nov -001 19:00:00 -0500',
    created_at: moment().subtract(1, 'weeks'),
    updated_at: moment().subtract(1, 'weeks'),
    is_deleted: false,
    login_email: 'amudantest@test.com',
    timezone_name: 'America/New_York',
    positions: [],
    locations: [ 1003762, 1003765 ],
    position_rates: [],
    position_quality: [],
    sort: { '1003762': 0, '1003765': 0 } 
  },
  { id: 5674724,
    account_id: 549781,
    login_id: 2761909,
    timezone_id: 0,
    country_id: 233,
    migration_id: 0,
    role: 3,
    is_payroll: false,
    is_trusted: 0,
    type: 1,
    email: 'amudantest@test.com',
    first_name: 'Amudan',
    last_name: 'Test',
    phone_number: '',
    employee_code: '',
    avatar:
     { url: 'https://avatars.wheniwork.com/dc02824b2af4ac232129a41fc376c77cc2ea3d5f/%s',
       size: '%s' },
    password: true,
    activated: true,
    is_hidden: false,
    uuid: '88ffabdddf9bb82r144f4476eacd3064f664dc0f',
    notes: '{"original_owner":5674723, "parent_shift":277119256}',
    affiliate: 0,
    is_private: true,
    infotips: '',
    hours_preferred: 0,
    hours_max: 40,
    hourly_rate: 0,
    alert_settings:
     { timeoff: { sms: false, email: false },
       swaps: { sms: false, email: false },
       schedule: { sms: false, email: false },
       reminders: { sms: true, email: true },
       availability: { sms: false, email: false },
       new_employee: { sms: false, email: false },
       attendance: { sms: false, email: false } },
    reminder_time: 1,
    sleep_start: '23:00:00',
    sleep_end: '05:00:00',
    my_positions: [],
    last_login: 'Mon, 25 Jan 2016 21:30:38 -0500',
    dismissed_at: '',
    notified_at: 'Tue, 29 Nov -001 19:00:00 -0500',
    created_at: 'Tue, 19 Jan 2016 14:48:09 -0500',
    updated_at: 'Mon, 25 Jan 2016 21:32:47 -0500',
    is_deleted: false,
    login_email: 'amudantest@test.com',
    timezone_name: 'America/New_York',
    positions: [],
    locations: [ 1003762, 1003765 ],
    position_rates: [],
    position_quality: [],
    sort: { '1003762': 0, '1003765': 0 } 
  },
  { id: 5674794,
    account_id: 549781,
    login_id: 2761909,
    timezone_id: 0,
    country_id: 233,
    migration_id: 0,
    role: 3,
    is_payroll: false,
    is_trusted: 0,
    type: 1,
    email: 'amudantest@test.com',
    first_name: 'Amudan',
    last_name: 'Test',
    phone_number: '',
    employee_code: '',
    avatar:
     { url: 'https://avatars.wheniwork.com/dc02824b2af4ac232129a41fc376c77cc2ea3d5f/%s',
       size: '%s' },
    password: true,
    activated: true,
    is_hidden: false,
    uuid: '88ffabdddf9bb82r144f4476eacd3064f664dc0f',
    notes: '{"original_owner":5674723, "parent_shift":277119256}',
    affiliate: 0,
    is_private: true,
    infotips: '',
    hours_preferred: 0,
    hours_max: 40,
    hourly_rate: 0,
    alert_settings:
     { timeoff: { sms: false, email: false },
       swaps: { sms: false, email: false },
       schedule: { sms: false, email: false },
       reminders: { sms: true, email: true },
       availability: { sms: false, email: false },
       new_employee: { sms: false, email: false },
       attendance: { sms: false, email: false } },
    reminder_time: 1,
    sleep_start: '23:00:00',
    sleep_end: '05:00:00',
    my_positions: [],
    last_login: 'Mon, 25 Jan 2016 21:30:38 -0500',
    dismissed_at: '',
    notified_at: 'Tue, 29 Nov -001 19:00:00 -0500',
    created_at: 'Tue, 19 Jan 2016 14:48:09 -0500',
    updated_at: 'Mon, 25 Jan 2016 21:32:47 -0500',
    is_deleted: false,
    login_email: 'amudantest@test.com',
    timezone_name: 'America/New_York',
    positions: [],
    locations: [ 1003762, 1003765 ],
    position_rates: [],
    position_quality: [],
    sort: { '1003762': 0, '1003765': 0 } 
  }
  ],
  locations: [
      {
        "id": 959290,
        "account_id": 549781,
        "is_default": 0,
        "name": "New Graduate",
        "sort": 0,
        "max_hours": 4,
        "address": "82 4th Ave, Brooklyn, NY 11217, USA",
        "coordinates": [
          40.682108,
          -73.980149
        ],
        "latitude": 40.682108,
        "longitude": -73.980149,
        "place_id": "0",
        "place_confirmed": true,
        "ip_address": "",
        "created_at": "Wed, 16 Dec 2015 06:20:36 -0500",
        "updated_at": "Tue, 24 May 2016 13:43:39 -0400",
        "is_deleted": false,
        "radius": 100,
        "place": null
      },
      {
        "id": 990385,
        "account_id": 549781,
        "is_default": 0,
        "name": "Test",
        "sort": 0,
        "max_hours": 0,
        "address": "82 4th Ave, Brooklyn, NY 11217, USA",
        "coordinates": [
          40.682108,
          -73.980149
        ],
        "latitude": 40.682108,
        "longitude": -73.980149,
        "place_id": "92226",
        "place_confirmed": true,
        "ip_address": "",
        "created_at": "Wed, 06 Jan 2016 03:43:26 -0500",
        "updated_at": "Tue, 24 May 2016 13:44:00 -0400",
        "is_deleted": false,
        "radius": 100,
        "place": {
          "id": 92226,
          "business_name": "Pacific Standard",
          "address": "82 4th Ave, Brooklyn, NY 11217, USA",
          "latitude": 40.6821078,
          "longitude": -73.9801492,
          "place_type": [
            "bar",
            "restaurant",
            "food",
            "point_of_interest",
            "establishment"
          ],
          "place_id": "ChIJn_uB9qxbwokRtZCPRn3Eq9w",
          "updated_at": "Tue, 24 May 2016 16:01:08 -0400"
        }
      },
      {
        "id": 1003762,
        "account_id": 549781,
        "is_default": 0,
        "name": "One-time Shifts",
        "sort": 0,
        "max_hours": 4,
        "address": "82 4th Ave, Brooklyn, NY 11217, USA",
        "coordinates": [
          40.682108,
          -73.980149
        ],
        "latitude": 40.682108,
        "longitude": -73.980149,
        "place_id": "92226",
        "place_confirmed": true,
        "ip_address": "",
        "created_at": "Tue, 12 Jan 2016 06:48:08 -0500",
        "updated_at": "Tue, 24 May 2016 13:44:07 -0400",
        "is_deleted": false,
        "radius": 100,
        "place": {
          "id": 92226,
          "business_name": "Pacific Standard",
          "address": "82 4th Ave, Brooklyn, NY 11217, USA",
          "latitude": 40.6821078,
          "longitude": -73.9801492,
          "place_type": [
            "bar",
            "restaurant",
            "food",
            "point_of_interest",
            "establishment"
          ],
          "place_id": "ChIJn_uB9qxbwokRtZCPRn3Eq9w",
          "updated_at": "Tue, 24 May 2016 16:01:08 -0400"
        }
      },
      {
        "id": 1003765,
        "account_id": 549781,
        "is_default": 0,
        "name": "Weekly Shifts",
        "sort": 0,
        "max_hours": 8,
        "address": "82 4th Ave, Brooklyn, NY 11217, USA",
        "coordinates": [
          40.682108,
          -73.980149
        ],
        "latitude": 40.682108,
        "longitude": -73.980149,
        "place_id": "92226",
        "place_confirmed": true,
        "ip_address": "",
        "created_at": "Tue, 12 Jan 2016 06:48:23 -0500",
        "updated_at": "Tue, 24 May 2016 13:44:12 -0400",
        "is_deleted": false,
        "radius": 100,
        "place": {
          "id": 92226,
          "business_name": "Pacific Standard",
          "address": "82 4th Ave, Brooklyn, NY 11217, USA",
          "latitude": 40.6821078,
          "longitude": -73.9801492,
          "place_type": [
            "bar",
            "restaurant",
            "food",
            "point_of_interest",
            "establishment"
          ],
          "place_id": "ChIJn_uB9qxbwokRtZCPRn3Eq9w",
          "updated_at": "Tue, 24 May 2016 16:01:08 -0400"
        }
      },
      {
        "id": 1007104,
        "account_id": 549781,
        "is_default": 0,
        "name": "Test2",
        "sort": 0,
        "max_hours": 0,
        "address": "82 4th Ave, Brooklyn, NY 11217, USA",
        "coordinates": [
          40.682108,
          -73.980149
        ],
        "latitude": 40.682108,
        "longitude": -73.980149,
        "place_id": "92226",
        "place_confirmed": true,
        "ip_address": "",
        "created_at": "Wed, 13 Jan 2016 11:00:09 -0500",
        "updated_at": "Tue, 24 May 2016 13:44:25 -0400",
        "is_deleted": false,
        "radius": 100,
        "place": {
          "id": 92226,
          "business_name": "Pacific Standard",
          "address": "82 4th Ave, Brooklyn, NY 11217, USA",
          "latitude": 40.6821078,
          "longitude": -73.9801492,
          "place_type": [
            "bar",
            "restaurant",
            "food",
            "point_of_interest",
            "establishment"
          ],
          "place_id": "ChIJn_uB9qxbwokRtZCPRn3Eq9w",
          "updated_at": "Tue, 24 May 2016 16:01:08 -0400"
        }
      }
  ]
};

//created for MergeOpenShifts testing--these shifts are separate and should not be merged
var separateShifts = {
  shifts:
   [ { id: 284947012,
       account_id: 549781,
       user_id: 5674723,
       location_id: 1003765,
       position_id: 0,
       site_id: 0,
       start_time: 'Mon, 01 Feb 2016 12:00:00 -0500',
       end_time: 'Mon, 01 Feb 2016 14:00:00 -0500',
       break_time: 0,
       color: 'cccccc',
       notes: '{"original_owner":5674723, "parent_shift":277119037}',
       alerted: false,
       linked_users: null,
       shiftchain_key: '4kzmf1',
       published: true,
       published_date: 'Mon, 25 Jan 2016 09:42:28 -0500',
       notified_at: 'Tue, 29 Nov -001 19:00:00 -0500',
       instances: 1,
       created_at: 'Mon, 18 Jan 2016 08:52:20 -0500',
       updated_at: 'Mon, 25 Jan 2016 09:42:28 -0500',
       acknowledged: 1,
       acknowledged_at: '',
       creator_id: 5005069,
       is_open: false,
       actionable: false,
       block_id: 0 },
     { id: 277119037,
       account_id: 549781,
       user_id: 5674723,
       location_id: 1003765,
       position_id: 0,
       site_id: 0,
       start_time: 'Mon, 25 Jan 2016 12:00:00 -0500',
       end_time: 'Mon, 25 Jan 2016 14:00:00 -0500',
       break_time: 0,
       color: 'cccccc',
       notes: '{"original_owner":5674723, "parent_shift":277119037}',
       alerted: true,
       linked_users: null,
       shiftchain_key: '4kzmf1',
       published: true,
       published_date: 'Mon, 18 Jan 2016 08:52:23 -0500',
       notified_at: 'Tue, 29 Nov -001 19:00:00 -0500',
       instances: 0,
       created_at: 'Mon, 18 Jan 2016 08:52:20 -0500',
       updated_at: 'Mon, 25 Jan 2016 10:09:10 -0500',
       acknowledged: 1,
       acknowledged_at: '',
       creator_id: 5005069,
       is_open: false,
       actionable: false,
       block_id: 0 },
       ]
     };

module.exports = {
  shiftsResponse: wiwShiftObject,
  user: wiwUserObject,
  requestsResponse: wiwRequestsObject,
  separateShifts: separateShifts,
  usersResponse: wiwUsersObject
};
