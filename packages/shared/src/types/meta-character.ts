/** DTO returned by GET /api/v1/meta-character. */
export interface MetaCharacterDTO {
  id: string;
  name: string;
  avatarUrl?: string | undefined;
  level: number;
  xp: number;
  raceId?: string | undefined;
  /** Resolved race name from DB join. */
  raceName?: string | undefined;
  classId?: string | undefined;
  /** Resolved class name from DB join. */
  className?: string | undefined;
  createdAt: string;
}
