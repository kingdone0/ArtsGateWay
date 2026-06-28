const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generatePdfReport = async (reportData, reportTitle, type) => {
  let browser = null;
  
  try {
    console.log('📄 بدء إنشاء PDF مع puppeteer...');
    
    const safeTitle = (reportTitle || 'تقرير').replace(/[\\/:*?"<>|]/g, '_');
    const fileName = `${safeTitle}_${Date.now()}.pdf`;
    
    const dir = path.join(__dirname, '../files/reports');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const filePath = path.join(dir, fileName);


    const htmlContent = createHtmlContent(reportData, reportTitle, type);

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    await page.pdf({ 
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    console.log('✅ تم إنشاء PDF بنجاح:', filePath);
    return `/files/reports/${fileName}`;

  } catch (error) {
    console.error('❌ خطأ في إنشاء PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
const getTypeArabicName = (type) => {
  const typeNames = {
    'users': 'المستخدمين',
    'artworks': 'الأعمال الفنية',
    'financial': 'المالي',
    'sales': 'المبيعات',
    'artist-performance': 'أداء الفنانين',
    'platform-analytics': 'تحليلات المنصة',
    'admins': 'المشرفين',
    'reports': 'الإبلاغات',
    'events': 'الفعاليات'
  };
  return typeNames[type] || type;
};
const generateReportContent = (reportData, type) => {
  if (!reportData) {
    return '<div class="section"><p class="text-center">لا توجد بيانات لعرضها</p></div>';
  }

  switch(type) {
    case 'users':
      return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-value">${reportData.totalUsers || 0}</div>
                <div class="stat-label">إجمالي المستخدمين</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🆕</div>
                <div class="stat-value">${reportData.newUsers || 0}</div>
                <div class="stat-label">مستخدمين جدد</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🎨</div>
                <div class="stat-value">${reportData.artists || 0}</div>
                <div class="stat-label">فنانين</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">👤</div>
                <div class="stat-value">${reportData.regularUsers || 0}</div>
                <div class="stat-label">مستخدمين عاديين</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-value">${reportData.activeUsers || 0}</div>
                <div class="stat-label">نشطون</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">❌</div>
                <div class="stat-value">${reportData.inactiveUsers || 0}</div>
                <div class="stat-label">غير نشطون</div>
            </div>
        </div>
        
        ${reportData.recentUsers && reportData.recentUsers.length > 0 ? `
        <div class="section">
            <h3 class="section-title">المستخدمون المضافة حديثاً</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>اسم المستخدم</th>
                        <th>البريد الإلكتروني</th>
                        <th>الدور</th>
                        <th>تاريخ الانضمام</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.recentUsers.map(user => `
                        <tr>
                            <td>${user.username || '-'}</td>
                            <td>${user.email || '-'}</td>
                            <td><span class="badge ${user.role === 'artist' ? 'badge-success' : 'badge-info'}">${user.role === 'artist' ? 'فنان' : 'مستخدم'}</span></td>
                            <td>${user.joined ? new Date(user.joined).toLocaleDateString('ar-EG') : '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}
      `;
    
    case 'artworks':
      return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">🖼️</div>
                <div class="stat-value">${reportData.totalArtworks || 0}</div>
                <div class="stat-label">إجمالي الأعمال</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">✨</div>
                <div class="stat-value">${reportData.newArtworks || 0}</div>
                <div class="stat-label">أعمال جديدة</div>
            </div>
        </div>
        
        ${reportData.categories && reportData.categories.length > 0 ? `
        <div class="section">
            <h3 class="section-title">التوزيع حسب الفئة</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>الفئة</th>
                        <th>عدد الأعمال</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.categories.map(cat => `
                        <tr>
                            <td>${cat._id || 'غير مصنف'}</td>
                            <td>${cat.count || 0}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}
        
        ${reportData.recentArtworks && reportData.recentArtworks.length > 0 ? `
        <div class="section">
            <h3 class="section-title">أحدث الأعمال الفنية</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>العنوان</th>
                        <th>الفنان</th>
                        <th>السعر</th>
                        <th>الفئة</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.recentArtworks.map(artwork => `
                        <tr>
                            <td>${artwork.title || '-'}</td>
                            <td>${artwork.artist || '-'}</td>
                            <td>$${artwork.price || 0}</td>
                            <td>${artwork.category || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}
      `;
    
    case 'events':
      return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">📅</div>
                <div class="stat-value">${reportData.totalEvents || 0}</div>
                <div class="stat-label">إجمالي الفعاليات</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🆕</div>
                <div class="stat-value">${reportData.newEvents || 0}</div>
                <div class="stat-label">فعاليات جديدة</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⏳</div>
                <div class="stat-value">${reportData.upcomingEvents || 0}</div>
                <div class="stat-label">فعاليات قادمة</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📜</div>
                <div class="stat-value">${reportData.pastEvents || 0}</div>
                <div class="stat-label">فعاليات سابقة</div>
            </div>
        </div>
        
        ${reportData.recentEvents && reportData.recentEvents.length > 0 ? `
        <div class="section">
            <h3 class="section-title">أحدث الفعاليات</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>العنوان</th>
                        <th>التاريخ</th>
                        <th>المكان</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.recentEvents.map(event => `
                        <tr>
                            <td>${event.title || '-'}</td>
                            <td>${event.date ? new Date(event.date).toLocaleDateString('ar-EG') : '-'}</td>
                            <td>${event.location || '-'}</td>
                            <td><span class="badge badge-info">${event.status || 'قادم'}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}
      `;
    
    case 'reports':
      return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">📋</div>
                <div class="stat-value">${reportData.totalReports || 0}</div>
                <div class="stat-label">إجمالي الإبلاغات</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🆕</div>
                <div class="stat-value">${reportData.newReports || 0}</div>
                <div class="stat-label">إبلاغات جديدة</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⏳</div>
                <div class="stat-value">${reportData.pendingReports || 0}</div>
                <div class="stat-label">قيد المراجعة</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-value">${reportData.completedReports || 0}</div>
                <div class="stat-label">تمت المعالجة</div>
            </div>
        </div>
        
        ${reportData.recentReports && reportData.recentReports.length > 0 ? `
        <div class="section">
            <h3 class="section-title">آخر الإبلاغات</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>العنوان</th>
                        <th>النوع</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.recentReports.map(report => `
                        <tr>
                            <td>${report.title || '-'}</td>
                            <td>${report.type || '-'}</td>
                            <td><span class="badge ${report.status === 'pending' ? 'badge-warning' : 'badge-success'}">${report.status === 'pending' ? 'قيد المراجعة' : 'تمت المعالجة'}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}
      `;
    
    case 'admins':
      const summary = reportData.summary || {};
      return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">👨‍💼</div>
                <div class="stat-value">${summary.total || 0}</div>
                <div class="stat-label">إجمالي المشرفين</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-value">${summary.active || 0}</div>
                <div class="stat-label">نشطون</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">❌</div>
                <div class="stat-value">${summary.suspended || 0}</div>
                <div class="stat-label">موقوفون</div>
            </div>
        </div>
        
        ${reportData.admins && reportData.admins.length > 0 ? `
        <div class="section">
            <h3 class="section-title">قائمة المشرفين</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>اسم المستخدم</th>
                        <th>البريد الإلكتروني</th>
                        <th>الدور</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.admins.map(admin => `
                        <tr>
                            <td>${admin.username || '-'}</td>
                            <td>${admin.email || '-'}</td>
                            <td>${admin.role || 'مشرف'}</td>
                            <td><span class="badge ${admin.isActive ? 'badge-success' : 'badge-warning'}">${admin.isActive ? 'نشط' : 'موقوف'}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}
      `;
    
    default:
      return `
        <div class="section">
            <h3 class="section-title">بيانات التقرير</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>المفتاح</th>
                        <th>القيمة</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(reportData).map(([key, value]) => `
                        <tr>
                            <td><strong>${key}</strong></td>
                            <td>${typeof value === 'object' ? JSON.stringify(value) : value}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
      `;
  }
};
const createHtmlContent = (reportData, reportTitle, type) => {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>${reportTitle}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Tajawal', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
            color: #333;
        }
        
        .report-card {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .report-header {
            background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .report-title {
            font-size: 2.5em;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .report-subtitle {
            font-size: 1.1em;
            opacity: 0.9;
            margin-bottom: 20px;
        }
        
        .report-meta {
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
            margin-top: 20px;
        }
        
        .meta-item {
            background: rgba(255,255,255,0.15);
            padding: 10px 20px;
            border-radius: 25px;
        }
        
        .report-body {
            padding: 40px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: white;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
            border: 1px solid #f0f0f0;
        }
        
        .stat-icon {
            font-size: 2em;
            margin-bottom: 10px;
        }
        
        .stat-value {
            font-size: 1.8em;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: #7f8c8d;
            font-size: 0.85em;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 1.3em;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #3498db;
            display: inline-block;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        
        .data-table th {
            background: #34495e;
            color: white;
            padding: 12px;
            text-align: right;
            font-weight: 600;
        }
        
        .data-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .data-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.75em;
            font-weight: 600;
        }
        
        .badge-success {
            background: #d4edda;
            color: #155724;
        }
        
        .badge-warning {
            background: #fff3cd;
            color: #856404;
        }
        
        .badge-info {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        .report-footer {
            background: #f8f9fa;
            padding: 25px 40px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .footer-text {
            color: #6c757d;
            font-size: 0.85em;
        }
        
        .text-center {
            text-align: center;
        }
        
        @media (max-width: 768px) {
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .report-header {
                padding: 30px 20px;
            }
            
            .report-body {
                padding: 20px;
            }
            
            .report-title {
                font-size: 1.8em;
            }
        }
    </style>
</head>
<body>
    <div class="report-card">
        <div class="report-header">
            <h1 class="report-title">${reportTitle}</h1>
            <div class="report-subtitle">تقرير احترافي - نظام بوابة الفنون</div>
            <div class="report-meta">
                <div class="meta-item">
                    📅 ${new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div class="meta-item">
                    🕒 ${new Date().toLocaleTimeString('ar-EG')}
                </div>
                <div class="meta-item">
                    📊 ${getTypeArabicName(type)}
                </div>
            </div>
        </div>
        
        <div class="report-body">
            ${generateReportContent(reportData, type)}
        </div>
        
        <div class="report-footer">
            <div class="footer-text">
                <p>تم إنشاء هذا التقرير تلقائياً من نظام إدارة المنصة</p>
                <p>جميع الحقوق محفوظة © ${new Date().getFullYear()} - بوابة الفنون (ArtsGateway)</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};

module.exports = generatePdfReport;