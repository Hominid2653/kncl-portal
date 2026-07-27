Project KNCL_Transfer_Portal {
  database_type: "PostgreSQL"

  Note: '''
  Kenyan National Chess League
  Registration & Transfer Management System
  Version 1.0
  '''
}

Enum user_role {
  PLAYER
  CLUB_ADMIN
  LEAGUE_COORDINATOR
  FEDERATION_ADMIN
}

Enum registration_status {
  PENDING
  APPROVED
  REJECTED
}

Enum transfer_status {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

Enum approval_decision {
  APPROVED
  REJECTED
}

Table leagues {

  id uuid [pk]

  name varchar(150) [not null]

  description text

  created_at timestamp [not null]

  updated_at timestamp
}

Table user_profiles {

  id uuid [pk]

  auth_user_id uuid [not null, unique]

  first_name varchar(100) [not null]

  last_name varchar(100) [not null]

  phone varchar(20)

  role user_role [not null]

  created_at timestamp [not null]

  updated_at timestamp
}

Table players {

  id uuid [pk]

  user_profile_id uuid [not null, unique]

  federation_id varchar(50)

  fide_id varchar(50)

  chesscom_username varchar(100)

  lichess_username varchar(100)

  rapid_rating int

  blitz_rating int

  classical_rating int

  nationality varchar(100)

  date_of_birth date

  profile_photo text

  created_at timestamp [not null]

  updated_at timestamp
}

Table clubs {

  id uuid [pk]

  league_id uuid [not null]

  name varchar(150) [not null]

  county varchar(100)

  description text

  logo text

  founded_year int

  created_at timestamp [not null]

  updated_at timestamp
}

Table club_members {

  id uuid [pk]

  club_id uuid [not null]

  user_profile_id uuid [not null]

  position varchar(50) [not null]

  created_at timestamp [not null]

  updated_at timestamp
}

Table seasons {

  id uuid [pk]

  league_id uuid [not null]

  name varchar(100) [not null]

  year int [not null]

  registration_open boolean [not null]

  transfers_open boolean [not null]

  start_date date

  end_date date

  created_at timestamp [not null]

  updated_at timestamp
}

Table registrations {

  id uuid [pk]

  player_id uuid [not null]

  club_id uuid [not null]

  season_id uuid [not null]

  status registration_status [not null]

  registered_at timestamp [not null]

  created_at timestamp [not null]

  updated_at timestamp

  Note: 'Represents a player registered to a club for a specific season.'
}

Table transfers {

  id uuid [pk]

  registration_id uuid [not null]

  from_club_id uuid [not null]

  to_club_id uuid [not null]

  reason text

  status transfer_status [not null]

  submitted_at timestamp [not null]

  completed_at timestamp

  created_at timestamp [not null]

  updated_at timestamp
}

Table transfer_approvals {

  id uuid [pk]

  transfer_id uuid [not null]

  approved_by uuid [not null]

  decision approval_decision [not null]

  remarks text

  approved_at timestamp [not null]

  created_at timestamp [not null]
}

Table documents {

  id uuid [pk]

  transfer_id uuid [not null]

  uploaded_by uuid [not null]

  document_type varchar(100)

  file_name varchar(255)

  file_url text

  uploaded_at timestamp [not null]

  created_at timestamp [not null]
}

Table notifications {

  id uuid [pk]

  user_profile_id uuid [not null]

  title varchar(255) [not null]

  message text [not null]

  is_read boolean [default: false]

  created_at timestamp [not null]
}

Table audit_logs {

  id uuid [pk]

  user_profile_id uuid [not null]

  action varchar(255) [not null]

  entity varchar(100) [not null]

  entity_id uuid

  ip_address varchar(50)

  created_at timestamp [not null]
}

Ref: clubs.league_id > leagues.id

Ref: seasons.league_id > leagues.id

Ref: players.user_profile_id > user_profiles.id

Ref: club_members.club_id > clubs.id

Ref: club_members.user_profile_id > user_profiles.id

Ref: registrations.player_id > players.id

Ref: registrations.club_id > clubs.id

Ref: registrations.season_id > seasons.id

Ref: transfers.registration_id > registrations.id

Ref: transfers.from_club_id > clubs.id

Ref: transfers.to_club_id > clubs.id

Ref: transfer_approvals.transfer_id > transfers.id

Ref: transfer_approvals.approved_by > user_profiles.id

Ref: documents.transfer_id > transfers.id

Ref: documents.uploaded_by > user_profiles.id

Ref: notifications.user_profile_id > user_profiles.id

Ref: audit_logs.user_profile_id > user_profiles.id