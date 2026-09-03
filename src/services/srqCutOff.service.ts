import { eq } from "drizzle-orm";
import { db } from "@/db";
import { srqCutOffs } from "@/db/schema/srqCutOff";
import { AuditLogService } from "@/services/auditLog.service";
import { UserActor } from "@/services/user.service";
import { NotFoundError } from "@/utils/errors";
import { UpdateSrqCutOffInput } from "../types/srqCutOff.types";

export class SrqCutOffService {
  /**
   * GET ACTIVE CUT-OFF CONFIGURATION
   */
  static async getActiveCutOff() {
    const [config] = await db
      .select()
      .from(srqCutOffs)
      .where(eq(srqCutOffs.isActive, true))
      .limit(1);

    if (!config) {
      throw new NotFoundError("Konfigurasi Cut-Off SRQ tidak ditemukan");
    }

    return config;
  }

  /**
   * UPDATE CUT-OFF CONFIGURATION + AUDIT LOG RECORD
   */
  static async updateCutOff(
    id: string,
    input: UpdateSrqCutOffInput,
    actor?: UserActor,
    ipAddress?: string,
  ) {
    const existingConfig = await db.query.srqCutOffs.findFirst({
      where: eq(srqCutOffs.id, id),
    });

    if (!existingConfig) {
      throw new NotFoundError("Konfigurasi Cut-Off SRQ tidak ditemukan");
    }

    await db
      .update(srqCutOffs)
      .set({
        cutoffScore: input.cutoffScore,
        label: input.label,
        description: input.description,
        updatedAt: new Date(),
      })
      .where(eq(srqCutOffs.id, id));

    const updatedConfig = await db.query.srqCutOffs.findFirst({
      where: eq(srqCutOffs.id, id),
    });

    if (!updatedConfig) {
      throw new NotFoundError("Gagal memperbarui data Cut-Off SRQ");
    }

    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "SRQ_CUTOFF_UPDATE",
      module: "ASSESSMENT_SETTING",
      targetEntity: "srq_cut_offs",
      targetId: id,
      ipAddress,
      details: {
        previousState: {
          cutoffScore: existingConfig.cutoffScore,
          label: existingConfig.label,
          description: existingConfig.description,
        },
        updatedFields: input,
      },
    });

    return updatedConfig;
  }
}
