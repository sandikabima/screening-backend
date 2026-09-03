import "dotenv/config";
import { db } from "@/db";
import { triageQuestions, triageOptions } from "@/db/schema/assessment";
import { eq } from "drizzle-orm";

export const seedQuestionsAndOptions = async () => {
  console.log("🌱 Starting Seeding Triage & SRQ Questions...");

  // --------------------------------------------------------------------------
  // 1. DATA MASTER SRQ-20 (20 SOAL BAKU WHO)
  // --------------------------------------------------------------------------
  const srqQuestionsList = [
    "Apakah Anda sering menderita sakit kepala?",
    "Apakah Anda tidak nafsu makan?",
    "Apakah Anda sulit tidur?",
    "Apakah Anda mudah merasa takut?",
    "Apakah Anda merasa tegang, cemas, atau khawatir?",
    "Apakah tangan Anda gemetar?",
    "Apakah pencernaan Anda buruk atau perut terasa tidak enak?",
    "Apakah Anda sulit berpikir jernih?",
    "Apakah Anda merasa tidak bahagia?",
    "Apakah Anda menangis lebih sering dari biasanya?",
    "Apakah Anda merasa sulit untuk menikmati aktivitas sehari-hari?",
    "Apakah Anda kesulitan mengambil keputusan?",
    "Apakah pekerjaan sehari-hari Anda terganggu?",
    "Apakah Anda tidak mampu melakukan hal-hal yang berguna dalam hidup?",
    "Apakah Anda kehilangan minat pada berbagai hal?",
    "Apakah Anda merasa tidak berharga?",
    "Apakah Anda mempunyai pikiran untuk mengakhiri hidup Anda?",
    "Apakah Anda merasa lelah sepanjang waktu?",
    "Apakah Anda mengalami rasa tidak enak di perut?",
    "Apakah Anda mudah lelah?",
  ];

  for (let i = 0; i < srqQuestionsList.length; i++) {
    const code = `SRQ-${String(i + 1).padStart(2, "0")}`;

    // Cek atau Insert Question
    let [question] = await db
      .select()
      .from(triageQuestions)
      .where(eq(triageQuestions.code, code));

    if (!question) {
      [question] = await db
        .insert(triageQuestions)
        .values({
          code,
          category: "SRQ",
          questionText: srqQuestionsList[i],
          orderNumber: i + 1,
          isActive: true,
        })
        .returning();

      // Insert Opsi SRQ (Tidak = 0, Ya = 1)
      await db.insert(triageOptions).values([
        {
          questionId: question.id,
          optionLabel: "Tidak",
          score: 0,
          orderNumber: 1,
        },
        {
          questionId: question.id,
          optionLabel: "Ya",
          score: 1,
          orderNumber: 2,
        },
      ]);
      console.log(`[+] Inserted: ${code}`);
    } else {
      console.log(`[-] Exists: ${code}`);
    }
  }

  // --------------------------------------------------------------------------
  // 2. DATA MASTER PERTANYAAN INTI TRIAGE (7 PERTANYAAN)
  // --------------------------------------------------------------------------
  const intiQuestionsList = [
    {
      code: "INTI-F1",
      questionText:
        "Seberapa terganggu fungsi akademik / perkuliahan Anda saat ini?",
      orderNumber: 21,
      options: [
        { label: "Tidak Terganggu", score: 0 },
        { label: "Sedikit Terganggu", score: 1 },
        { label: "Cukup Terganggu", score: 2 },
        { label: "Sangat Terganggu", score: 3 },
      ],
    },
    {
      code: "INTI-F2",
      questionText:
        "Seberapa terganggu aktivitas sehari-hari (makan, mandi, istirahat, bersosialisasi) Anda?",
      orderNumber: 22,
      options: [
        { label: "Tidak Terganggu", score: 0 },
        { label: "Sedikit Terganggu", score: 1 },
        { label: "Cukup Terganggu", score: 2 },
        { label: "Sangat Terganggu", score: 3 },
      ],
    },
    {
      code: "INTI-C1",
      questionText:
        "Bagaimana kemampuan Anda dalam mengatasi atau mengelola stres/masalah saat ini?",
      orderNumber: 23,
      options: [
        { label: "Sangat Baik / Mampu", score: 0 },
        { label: "Cukup Mampu", score: 1 },
        { label: "Kurang Mampu", score: 2 },
        { label: "Sangat Tidak Mampu", score: 3 },
      ],
    },
    {
      code: "INTI-S1",
      questionText:
        "Seberapa cukup dukungan dari orang sekitar (keluarga/teman) saat Anda menghadapi masalah?",
      orderNumber: 24,
      options: [
        { label: "Sangat Cukup", score: 0 },
        { label: "Cukup", score: 1 },
        { label: "Kurang", score: 2 },
        { label: "Sangat Kurang", score: 3 },
      ],
    },
    {
      code: "INTI-H1",
      questionText:
        "Seberapa besar kebutuhan Anda untuk mendapatkan bantuan atau konseling profesional saat ini?",
      orderNumber: 25,
      options: [
        { label: "Tidak Butuh", score: 0 },
        { label: "Sedikit Butuh", score: 1 },
        { label: "Butuh Bantuan", score: 2 },
        { label: "Sangat Butuh Segera", score: 3 },
      ],
    },
    {
      code: "INTI-SF",
      questionText:
        "Apakah Anda memiliki pikiran atau dorongan untuk menyakiti diri sendiri atau mengakhiri hidup?",
      orderNumber: 26,
      options: [
        { label: "TIDAK", score: 0 },
        { label: "YA", score: 1 }, // Trigger Safety Override (P1)
      ],
    },
    {
      code: "INTI-M1",
      questionText:
        "Pilih kategori masalah utama yang sedang Anda hadapi saat ini (Bisa pilih lebih dari satu):",
      orderNumber: 27,
      options: [
        { label: "Akademik / Perksuliahan / Tugas Akhir", score: 0 },
        { label: "Finansial / Keuangan", score: 0 },
        { label: "Keluarga / Orang Tua", score: 0 },
        { label: "Hubungan Asmara / Pasangan", score: 0 },
        { label: "Pergaulan / Pertemanan", score: 0 },
        { label: "Kesehatan Fisik", score: 0 },
        { label: "Lainnya", score: 0 },
      ],
    },
  ];

  for (const item of intiQuestionsList) {
    let [question] = await db
      .select()
      .from(triageQuestions)
      .where(eq(triageQuestions.code, item.code));

    if (!question) {
      [question] = await db
        .insert(triageQuestions)
        .values({
          code: item.code,
          category: "INTI",
          questionText: item.questionText,
          orderNumber: item.orderNumber,
          isActive: true,
        })
        .returning();

      const optionsToInsert = item.options.map((opt, idx) => ({
        questionId: question.id,
        optionLabel: opt.label,
        score: opt.score,
        orderNumber: idx + 1,
      }));

      await db.insert(triageOptions).values(optionsToInsert);
      console.log(`[+] Inserted: ${item.code}`);
    } else {
      console.log(`[-] Exists: ${item.code}`);
    }
  }

  console.log("✅ Seeding Questions & Options Completed Successfully!");
};

// ============================================================================
// EKSEKUSI OTOMATIS SAAT FILE DIJALANKAN
// ============================================================================
seedQuestionsAndOptions()
  .then(() => {
    console.log("🚀 Seeder process finished.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  });
