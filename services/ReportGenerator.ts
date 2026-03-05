import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, VerificationRecord, CustomizationPoint, MigrationIssue } from '../types';

interface ProjectReportData {
    project: Project;
    customizationPoints: CustomizationPoint[];
    issues: MigrationIssue[];
}

export const generateProjectReport = (data: ProjectReportData) => {
    const { project, customizationPoints, issues } = data;
    const doc = new jsPDF();

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(15, 41, 77); // Dark Blue #0f294d
    doc.text('MigraTrack Pro', 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Project Status Report', 14, 28);
    doc.line(14, 32, 196, 32); // Horizontal line

    // --- Project Info ---
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Project: ${project.clientName}`, 14, 45);

    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`Client: ${project.clientName}`, 14, 52);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 58);

    // Status Badge Simulation
    doc.setFillColor(16, 185, 129); // Green
    doc.roundedRect(140, 40, 40, 10, 2, 2, 'F');
    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.text('ACTIVE', 160, 46, { align: 'center' });

    let finalY = 70;

    // --- Summary Statistics ---
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text('Summary', 14, finalY);
    finalY += 8;

    const totalCustomizations = customizationPoints.length;
    const completedCustomizations = customizationPoints.filter(cp => cp.status === 'Completed').length;
    const billableCustomizations = customizationPoints.filter(cp => cp.isBillable).length;

    const totalIssues = issues.length;
    const openIssues = issues.filter(i => i.status !== 'Closed').length;

    autoTable(doc, {
        startY: finalY,
        head: [['Metric', 'Count']],
        body: [
            ['Total Customization Points', totalCustomizations],
            ['Completed Customizations', completedCustomizations],
            ['Billable Customizations', billableCustomizations],
            ['Open Issues', openIssues],
            ['Total Issues', totalIssues],
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 41, 77] },
        styles: { fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold' } }
    });

    // @ts-ignore
    finalY = doc.lastAutoTable.finalY + 15;

    // --- Customization Points Section ---
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Customization Points', 14, finalY);
    finalY += 8;

    const customizationRows = customizationPoints.map(cp => [
        cp.title,
        cp.moduleName,
        cp.status,
        cp.isBillable ? 'Yes' : 'No'
    ]);

    autoTable(doc, {
        startY: finalY,
        head: [['Title', 'Module', 'Status', 'Billable']],
        body: customizationRows,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }, // Blue
        styles: { fontSize: 9 },
    });

    // @ts-ignore
    finalY = doc.lastAutoTable.finalY + 15;

    // --- Migration Issues Section ---
    if (issues.length > 0) {
        // Check if we need a new page
        if (finalY > 250) {
            doc.addPage();
            finalY = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Migration Issues', 14, finalY);
        finalY += 8;

        const issueRows = issues.map(issue => [
            issue.title,
            issue.priority,
            issue.status,
            issue.issueNumber
        ]);

        autoTable(doc, {
            startY: finalY,
            head: [['Issue Title', 'Priority', 'Status', 'Issue #']],
            body: issueRows,
            theme: 'grid',
            headStyles: { fillColor: [239, 68, 68] }, // Red
            styles: { fontSize: 9 },
        });
    }

    // Save the PDF
    doc.save(`${project.clientName.replace(/\s+/g, '_')}_Report.pdf`);
};
