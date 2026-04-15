import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { contactService } from "@/lib/contactService";
import {
  INQUIRY_PRIVACY_AGREEMENT_EN,
  INQUIRY_PRIVACY_AGREEMENT_KO,
} from "@/components/contact/inquiryPrivacyAgreementKo";

/* ── 스키마 ── */
const schema = z.object({
  name:         z.string().min(1, "이름을 입력하세요").max(50),
  email:        z.string().email("올바른 이메일 주소를 입력하세요"),
  inquiry_type: z.string().min(1, "문의 유형을 선택하세요"),
  subject:      z.string().min(1, "제목을 입력하세요").max(100),
  message:      z.string().min(10, "내용을 10자 이상 입력하세요").max(1300),
  /** 스팸 봇용 덫 — 사람은 비워 둠 */
  website: z.string().refine((v) => !v.trim(), { message: "접수가 거부되었습니다." }),
  privacy:      z.boolean().refine((v) => v === true, { message: "개인정보 수집·이용에 동의해주세요." }),
});

type FormData = z.infer<typeof schema>;

interface ContactFormProps {
  lang?: string;
}

const INQUIRY_TYPES = {
  ko: ["선택", "제품문의", "거래문의", "수출문의", "기타"],
  en: ["Select", "Product Inquiry", "Trade Inquiry", "Export Inquiry", "Other"],
};


function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block", marginBottom: "0.6rem",
          fontSize: "1.4rem", fontWeight: 600, color: "#333",
        }}
      >
        {label}
        {required && <span style={{ color: "#e53e3e", marginLeft: "0.2rem" }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ marginTop: "0.4rem", fontSize: "1.2rem", color: "#e53e3e" }}>{error}</p>
      )}
    </div>
  );
}

export function ContactForm({ lang = "ko" }: ContactFormProps) {
  const [submitted,   setSubmitted]   = useState(false);
  const [charCount,   setCharCount]   = useState(0);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { privacy: undefined as unknown as true, website: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await contactService.submit({
        name:    data.name,
        email:   data.email,
        subject: `[${data.inquiry_type}] ${data.subject}`,
        message: data.message,
        hp:      data.website ?? "",
      });
      setSubmitted(true);
      reset();
      setCharCount(0);
    } catch {
      setError("root", {
        message: lang === "ko"
          ? "문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
          : "An error occurred. Please try again later.",
      });
    }
  };

  /* ── 완료 화면 ── */
  if (submitted) {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "0.4rem",
          padding: "6rem 3rem",
          textAlign: "center",
          border: "1px solid #ddd",
        }}
      >
        <div
          style={{
            width: "6.4rem", height: "6.4rem", borderRadius: "50%",
            backgroundColor: "#e8f0fe",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 2.4rem",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="11" stroke="#000081" strokeWidth="2"/>
            <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#000081" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 style={{ fontSize: "2.2rem", fontWeight: 700, color: "#111", marginBottom: "1rem" }}>
          {lang === "ko" ? "문의가 접수되었습니다" : "Inquiry Submitted"}
        </h3>
        <p style={{ fontSize: "1.4rem", color: "#666", lineHeight: 1.8, marginBottom: "3rem", whiteSpace: "pre-line" }}>
          {lang === "ko"
            ? "빠른 시일 내에 담당자가 연락드리겠습니다.\n업무시간 내 순차적으로 답변드립니다."
            : "Our team will contact you shortly.\nWe respond during business hours in order."}
        </p>
        <button
          onClick={() => setSubmitted(false)}
          style={{
            padding: "1rem 3rem", border: "1px solid #222", borderRadius: "2rem",
            background: "none", cursor: "pointer", fontSize: "1.4rem", fontWeight: 600, color: "#222",
            transition: "background 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#222"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#222"; }}
        >
          {lang === "ko" ? "다시 문의하기" : "New Inquiry"}
        </button>
      </div>
    );
  }

  /* ── 개인정보 모달 ── */
  const PrivacyModal = () => (
    <div
      onClick={() => setShowPrivacy(false)}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          backgroundColor: "#fff",
          borderRadius: "0.8rem",
          padding: "2.4rem 2.4rem 2rem",
          maxWidth: 560,
          width: "100%",
          maxHeight: "min(85vh, 720px)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
        }}
      >
        <button
          type="button"
          aria-label={lang === "ko" ? "닫기" : "Close"}
          onClick={() => setShowPrivacy(false)}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            width: "3.2rem",
            height: "3.2rem",
            border: "none",
            background: "transparent",
            fontSize: "2.4rem",
            lineHeight: 1,
            color: "#666",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>
        <h3
          style={{
            fontSize: "1.8rem",
            fontWeight: 700,
            color: "#111",
            marginBottom: "1.2rem",
            paddingRight: "3rem",
          }}
        >
          {lang === "ko" ? "개인정보 수집 및 이용동의" : "Personal Information Agreement"}
        </h3>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            marginBottom: "1.6rem",
            paddingRight: "0.4rem",
          }}
        >
          <p
            style={{
              fontSize: "1.3rem",
              color: "#555",
              lineHeight: 1.8,
              whiteSpace: "pre-line",
              margin: 0,
            }}
          >
            {lang === "ko" ? INQUIRY_PRIVACY_AGREEMENT_KO : INQUIRY_PRIVACY_AGREEMENT_EN}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPrivacy(false)}
          style={{
            width: "100%",
            padding: "1.2rem",
            backgroundColor: "#000081",
            color: "#fff",
            border: "none",
            borderRadius: "0.4rem",
            fontSize: "1.4rem",
            fontWeight: 700,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {lang === "ko" ? "확인" : "Close"}
        </button>
      </div>
    </div>
  );

  /* ── 폼 ── */
  return (
    <>
      {showPrivacy && <PrivacyModal />}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        style={{ position: "relative", display: "flex", flexDirection: "column", gap: "2rem" }}
      >

        {/* 전역 에러 */}
        {errors.root && (
          <div
            style={{
              padding: "1.2rem 1.6rem", backgroundColor: "#fff5f5",
              border: "1px solid #fecaca", borderRadius: "0.4rem",
              fontSize: "1.3rem", color: "#e53e3e",
            }}
          >
            {errors.root.message}
          </div>
        )}

        {/* 개인정보 동의 */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <input
            id="privacy"
            type="checkbox"
            style={{ width: "1.5rem", height: "1.5rem", cursor: "pointer", accentColor: "#000081" }}
            {...register("privacy")}
          />
          <label htmlFor="privacy" style={{ fontSize: "1.3rem", color: "#555", cursor: "pointer" }}>
            {lang === "ko" ? "개인정보 수집 및 이용에 동의" : "I agree to the collection and use of personal information"}
          </label>
          <button
            type="button"
            onClick={() => setShowPrivacy(true)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "1.2rem", color: "#1565c0", fontWeight: 600,
              textDecoration: "underline", padding: 0,
            }}
          >
            {lang === "ko" ? "자세히 보기" : "Details"}
          </button>
        </div>
        {errors.privacy && (
          <p style={{ marginTop: "-1.2rem", fontSize: "1.2rem", color: "#e53e3e" }}>
            {errors.privacy.message}
          </p>
        )}

        {/* 이름 + 이메일 */}
        <div className="contact-name-grid">
          <Field label={lang === "ko" ? "이름" : "Name"} required error={errors.name?.message}>
            <input
              type="text"
              autoComplete="name"
              placeholder={lang === "ko" ? "이름을 입력하세요." : "Enter your name"}
              className="contact-input"
              {...register("name")}
            />
          </Field>

          <Field label={lang === "ko" ? "이메일" : "Email"} required error={errors.email?.message}>
            <input
              type="email"
              autoComplete="email"
              placeholder="example@email.com"
              className="contact-input"
              {...register("email")}
            />
          </Field>
        </div>

        {/* 문의유형 + 제목 */}
        <div className="contact-name-grid">
          <Field label={lang === "ko" ? "문의유형" : "Inquiry Type"} required error={errors.inquiry_type?.message}>
            <select className="contact-input" {...register("inquiry_type")}>
              {INQUIRY_TYPES[lang as "ko" | "en"]?.map((opt, i) => (
                <option key={opt} value={i === 0 ? "" : opt} disabled={i === 0}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>

          <Field label={lang === "ko" ? "제목" : "Subject"} required error={errors.subject?.message}>
            <input
              type="text"
              placeholder={lang === "ko" ? "제목을 입력하세요." : "Enter subject"}
              className="contact-input"
              {...register("subject")}
            />
          </Field>
        </div>

        {/* 내용 */}
        <Field label={lang === "ko" ? "내용" : "Message"} required error={errors.message?.message}>
          <textarea
            rows={9}
            placeholder={lang === "ko" ? "문의하실 내용을 입력해주세요." : "Please describe your inquiry."}
            className="contact-input contact-textarea"
            {...register("message", {
              onChange: (e) => setCharCount((e.target as HTMLTextAreaElement).value.length),
            })}
          />
          {/* 글자수 카운터 */}
          <div style={{ textAlign: "right", fontSize: "1.2rem", color: "#999", marginTop: "0.4rem" }}>
            {charCount} / 1,300 {lang === "ko" ? "Byte" : "Byte"}
          </div>
        </Field>

        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          {...register("website")}
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0,0,0,0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        />

        {/* 제출 버튼 */}
        <div style={{ textAlign: "center", paddingTop: "1.6rem" }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "1.2rem 5rem",
              backgroundColor: isSubmitting ? "#e5e7eb" : "transparent",
              color: isSubmitting ? "#9ca3af" : "#222",
              border: "1px solid #222",
              borderRadius: "3rem",
              fontSize: "1.5rem",
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              letterSpacing: "-0.01em",
              transition: "background 0.2s, color 0.2s",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = "#222";
                e.currentTarget.style.color = "#fff";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#222";
              }
            }}
          >
            {isSubmitting ? (
              <>
                <svg style={{ animation: "spin 1s linear infinite" }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(156,163,175,0.5)" strokeWidth="3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                {lang === "ko" ? "접수 중..." : "Submitting..."}
              </>
            ) : (
              lang === "ko" ? "문의하기" : "Submit"
            )}
          </button>
        </div>
      </form>
    </>
  );
}
