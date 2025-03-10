const { contextBridge } = require('electron');
const ExcelJS = require('exceljs');

contextBridge.exposeInMainWorld('exceljs', {
    exportToExcel: async (workers) => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Workers');

            // إضافة العناوين
            worksheet.columns = [
                { header: 'اسم العامل', key: 'name', width: 20 },
                { header: 'الحضور', key: 'present', width: 15 },
                { header: 'اليومية', key: 'dailyWage', width: 15 },
                { header: 'السلفة', key: 'advances', width: 15 },
                { header: 'المتبقي', key: 'remaining', width: 15 }
            ];

            // إضافة البيانات
            workers.forEach(worker => {
                worksheet.addRow({
                    name: worker.name,
                    present: worker.present ? 'حاضر' : 'غائب',
                    dailyWage: worker.dailyWage,
                    advances: worker.advances,
                    remaining: worker.totalEarnings - worker.advances
                });
            });

            // تصدير الملف
            const buffer = await workbook.xlsx.writeBuffer();
            return buffer;
        } catch (error) {
            throw new Error('Error exporting to Excel: ' + error.message);
        }
    }
});