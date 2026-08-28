import { BodrProposal } from "@/app/lib/api";

export function downloadBodrPdf(proposal: BodrProposal) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>${proposal.bodrNo}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          @media print {
            body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; padding: 20px; }
            .no-print { display: none; }
          }
          body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; padding: 40px; max-width: 900px; margin: 0 auto; }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-center">
          <div>
            <h1 class="text-xl font-semibold tracking-tight text-slate-900 uppercase">PT MENARA TERUS MAKMUR</h1>
            <p class="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">BOD REVIEW AUTHORIZATION FORM (BODR)</p>
          </div>
          <div class="text-right">
            <span class="text-xs font-mono font-bold bg-slate-100 border border-slate-350 px-3 py-1 rounded text-slate-800">
              ${proposal.bodrNo}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-x-8 gap-y-4 mb-6 text-xs">
          <div>
            <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Detail Pengajuan</p>
            <table class="w-full mt-2 border-t border-slate-200">
              <tr class="border-b border-slate-100"><td class="py-1.5 text-slate-500">Cost Center:</td><td class="py-1.5 font-bold text-slate-800">${proposal.costCenter}</td></tr>
              <tr class="border-b border-slate-100"><td class="py-1.5 text-slate-500">User / Pengusul:</td><td class="py-1.5 font-bold text-slate-800">${proposal.proposer}</td></tr>
              <tr class="border-b border-slate-100"><td class="py-1.5 text-slate-500">Departement:</td><td class="py-1.5 font-bold text-slate-800">${proposal.department}</td></tr>
              <tr class="border-b border-slate-100"><td class="py-1.5 text-slate-500">Type BODR:</td><td class="py-1.5 font-bold text-slate-800">${proposal.category}</td></tr>
            </table>
          </div>
          <div>
            <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Timeline & Anggaran</p>
            <table class="w-full mt-2 border-t border-slate-200">
              <tr class="border-b border-slate-100"><td class="py-1.5 text-slate-500">Start Date:</td><td class="py-1.5 font-bold text-slate-800">${proposal.startDate}</td></tr>
              <tr class="border-b border-slate-100"><td class="py-1.5 text-slate-500">End Date:</td><td class="py-1.5 font-bold text-slate-800">${proposal.endDate}</td></tr>
              <tr class="border-b border-slate-100"><td class="py-1.5 text-slate-500">Kriteria Budget:</td><td class="py-1.5 font-bold text-slate-800 uppercase">${proposal.budgetType}</td></tr>
              <tr class="border-b border-slate-100"><td class="py-1.5 text-slate-500">Nilai Investasi:</td><td class="py-1.5 font-semibold text-blue-600 text-sm">Rp ${proposal.amount.toLocaleString("id-ID")}</td></tr>
            </table>
          </div>
        </div>

        <div class="mb-6 text-xs">
          <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">Judul Investasi</p>
          <div class="bg-slate-50 border border-slate-200 rounded-lg p-3.5 font-bold text-slate-800">
            ${proposal.title}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-x-8 gap-y-4 mb-6 text-xs">
          <div>
            <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">Benefit / Manfaat</p>
            <div class="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-slate-700 whitespace-pre-wrap leading-relaxed">
              ${proposal.benefit}
            </div>
          </div>
          <div>
            <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">Aset & Capex Terkait</p>
            <table class="w-full border-t border-slate-200">
              <tr class="border-b border-slate-100"><td class="py-1.5 text-slate-500">Nama Asset:</td><td class="py-1.5 font-bold text-slate-800">${proposal.namaAsset}</td></tr>
              <tr class="border-b border-slate-100"><td class="py-1.5 text-slate-500">Asset No:</td><td class="py-1.5 font-mono font-bold text-slate-800">${proposal.noAsset}</td></tr>
              <tr class="border-b border-slate-100"><td class="py-1.5 text-slate-500">ID Capex:</td><td class="py-1.5 font-bold text-slate-800">${proposal.capexId}</td></tr>
            </table>
          </div>
        </div>

        <div class="mb-6">
          <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-3">Daftar Otorisasi & Riwayat Approval</p>
          <table class="w-full text-[10px] border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-200">
            <thead class="bg-slate-50 font-bold text-slate-600">
              <tr>
                <th class="px-4 py-2.5 text-left uppercase tracking-wider">Aktor / Otorisator</th>
                <th class="px-4 py-2.5 text-left uppercase tracking-wider">Status</th>
                <th class="px-4 py-2.5 text-left uppercase tracking-wider">Tanggal & Waktu</th>
                <th class="px-4 py-2.5 text-left uppercase tracking-wider">Catatan Justifikasi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 text-slate-700">
              ${proposal.approvalHistory.map(ap => `
                <tr>
                  <td class="px-4 py-3 font-bold">${ap.role}<br><span class="text-[8px] font-normal text-slate-450">${ap.name}</span></td>
                  <td class="px-4 py-3"><span class="text-[8px] font-semibold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">${ap.status}</span></td>
                  <td class="px-4 py-3 text-slate-500 font-mono text-[9px]">${ap.timestamp}</td>
                  <td class="px-4 py-3 italic leading-relaxed text-slate-600">${ap.note}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <div class="mt-16 border-t border-slate-200 pt-4 flex justify-between items-center text-[9px] text-slate-400 select-none">
          <span>Dicetak secara otomatis oleh MTM Capex & BOD Review System</span>
          <span>Halaman 1 dari 1</span>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function exportBodrToExcel(filtered: BodrProposal[]) {
  const htmlHeader = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        table { border-collapse: collapse; font-family: sans-serif; font-size: 11px; }
        th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #475569; padding: 10px; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
        td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; vertical-align: middle; }
        .font-mono { font-family: monospace; font-weight: bold; }
        .amount { text-align: right; }
        .center { text-align: center; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">NO</th>
            <th style="width: 140px;">BODR ID</th>
            <th style="width: 180px;">BODR NO</th>
            <th style="width: 130px;">CREATE DATE</th>
            <th style="width: 160px;">REQUESTER</th>
            <th style="width: 280px;">TITLE</th>
            <th style="width: 280px;">BENEFIT</th>
            <th style="width: 140px;">AMOUNT</th>
            <th style="width: 120px;">STATUS BODR</th>
            <th style="width: 100px;">CAPEX ID</th>
            <th style="width: 120px;">NO ASSET</th>
          </tr>
        </thead>
        <tbody>
  `;

  const htmlRows = filtered.map((p, idx) => `
    <tr>
      <td class="center font-mono">${idx + 1}</td>
      <td class="font-mono" style="mso-number-format:'@';">${p.id}</td>
      <td class="font-mono" style="mso-number-format:'@';">${p.bodrNo}</td>
      <td style="mso-number-format:'@';">${p.date}</td>
      <td>${p.proposer}</td>
      <td>${p.title}</td>
      <td>${p.benefit}</td>
      <td class="amount" style="mso-number-format:'\\#\\,\\#\\#0';">Rp ${p.amount.toLocaleString("id-ID")}</td>
      <td class="center">${p.status}</td>
      <td class="center font-mono" style="mso-number-format:'@';">${p.capexId}</td>
      <td class="center font-mono" style="mso-number-format:'@';">${p.noAsset}</td>
    </tr>
  `).join("");

  const htmlFooter = `
        </tbody>
      </table>
    </body>
    </html>
  `;

  const fullHtml = htmlHeader + htmlRows + htmlFooter;
  const blob = new Blob([fullHtml], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `BODR_Report_${new Date().toISOString().slice(0, 10)}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
