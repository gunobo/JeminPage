export default function Privacy() {
  return (
    <main className="bg-[#0a0a0a] text-white min-h-screen">
      <div className="px-6 md:px-12 pt-32 pb-24 max-w-3xl mx-auto">
        <div className="border-b border-white/10 pb-12 mb-16">
          <span className="text-xs font-semibold tracking-[0.3em] text-white/30 uppercase">Legal</span>
          <h1 className="font-black text-5xl md:text-7xl tracking-tighter leading-none mt-2">개인정보<br />처리방침</h1>
          <p className="text-white/30 mt-6 text-sm">최종 수정일: 2026년 8월 29일</p>
        </div>

        <div className="space-y-12 text-white/60 leading-relaxed">

          <section>
            <h2 className="text-white font-black text-xl tracking-tight mb-4">1. 개요</h2>
            <p className="text-sm">
              임제민(이하 "운영자")은 imjemin.co.kr(이하 "사이트")을 운영하며, 이용자의 개인정보를 중요하게 생각합니다.
              본 방침은 사이트에서 수집하는 개인정보의 항목, 이용 목적, 보유 기간 및 처리 방법을 안내합니다.
            </p>
          </section>

          <section>
            <h2 className="text-white font-black text-xl tracking-tight mb-4">2. 수집하는 개인정보 항목</h2>
            <div className="border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold tracking-widest text-white/30 uppercase">수집 경로</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold tracking-widest text-white/30 uppercase">수집 항목</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold tracking-widest text-white/30 uppercase">수집 목적</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="px-5 py-4">문의 양식</td>
                    <td className="px-5 py-4">이름, 이메일, 문의 내용</td>
                    <td className="px-5 py-4">문의 접수 및 답변</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4">이메일 인증</td>
                    <td className="px-5 py-4">이메일 주소</td>
                    <td className="px-5 py-4">본인 확인 (OTP 발송)</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4">방문 통계</td>
                    <td className="px-5 py-4">IP 주소 (익명 처리)</td>
                    <td className="px-5 py-4">방문자 수 집계</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-white font-black text-xl tracking-tight mb-4">3. 개인정보 보유 및 이용 기간</h2>
            <ul className="text-sm space-y-2">
              <li className="flex gap-3"><span className="text-white/20 shrink-0">·</span>문의 내용: 문의 처리 완료 후 <strong className="text-white/80">1년</strong> 보관 후 파기</li>
              <li className="flex gap-3"><span className="text-white/20 shrink-0">·</span>이메일 인증 정보(OTP): 인증 완료 또는 발급 후 <strong className="text-white/80">5분</strong> 이내 자동 삭제</li>
              <li className="flex gap-3"><span className="text-white/20 shrink-0">·</span>방문 통계: 수집일로부터 <strong className="text-white/80">1년</strong> 보관 후 파기</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-black text-xl tracking-tight mb-4">4. 개인정보의 제3자 제공</h2>
            <p className="text-sm">
              운영자는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
              다만, 법령에 의거하거나 수사기관의 요청이 있는 경우에는 예외로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-white font-black text-xl tracking-tight mb-4">5. 개인정보 처리 위탁</h2>
            <div className="border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold tracking-widest text-white/30 uppercase">수탁업체</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold tracking-widest text-white/30 uppercase">위탁 업무</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-5 py-4">Google (Gmail)</td>
                    <td className="px-5 py-4">이메일 발송</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-white font-black text-xl tracking-tight mb-4">6. 이용자의 권리</h2>
            <p className="text-sm">
              이용자는 언제든지 자신의 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.
              아래 이메일로 요청하시면 지체 없이 처리하겠습니다.
            </p>
          </section>

          <section>
            <h2 className="text-white font-black text-xl tracking-tight mb-4">7. 개인정보 보호책임자</h2>
            <div className="border border-white/10 p-6 text-sm space-y-2">
              <p><span className="text-white/30 w-24 inline-block">책임자</span>임제민</p>
              <p><span className="text-white/30 w-24 inline-block">이메일</span>
                <a href="mailto:startea0716@gmail.com" className="text-white/60 hover:text-white transition-colors">startea0716@gmail.com</a>
              </p>
              <p><span className="text-white/30 w-24 inline-block">사이트</span>
                <a href="https://imjemin.co.kr" className="text-white/60 hover:text-white transition-colors">imjemin.co.kr</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-white font-black text-xl tracking-tight mb-4">8. 개인정보 자동 수집 장치</h2>
            <p className="text-sm">
              본 사이트는 별도의 쿠키(Cookie)를 사용하지 않습니다.
              다만 로그인 상태 유지를 위해 브라우저의 <code className="text-white/80 bg-white/5 px-1.5 py-0.5 rounded">localStorage</code>에 인증 토큰을 저장할 수 있으며,
              이는 서버로 전송되지 않고 브라우저 내에서만 관리됩니다.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
