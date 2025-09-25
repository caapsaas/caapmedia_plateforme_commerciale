interface CsvHeader {
    key: string;
    label: string;
}

const escapeCsvCell = (cell: any): string => {
    if (cell === null || cell === undefined) {
        return '';
    }
    let str = String(cell);
    
    str = str.replace(/"/g, '""');

    if (str.search(/("|,|\n)/g) >= 0) {
        str = `"${str}"`;
    }
    return str;
};

export const exportToCsv = (filename: string, headers: CsvHeader[], data: any[]) => {
    const headerRow = headers.map(h => escapeCsvCell(h.label)).join(',');
    
    const dataRows = data.map(row => 
        headers.map(header => {
            const value = header.key.split('.').reduce((o, i) => (o ? o[i] : ''), row);
            return escapeCsvCell(value);
        }).join(',')
    );

    const csvContent = [headerRow, ...dataRows].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const downloadCsvTemplate = () => {
    const headers = ['name', 'category', 'description', 'stock', 'price', 'sellingPrice', 'warehouse', 'range'];
    const exampleData = [
        '"T-Shirt Personnalisé","Textile","T-shirt de haute qualité 100% coton.",500,5000,12000,"Douala Centre","Standard"',
        '"Flyers A5","Pub","Flyers couleur format A5, papier 135g.",10000,25,75,"Yaoundé Centre","Populaire"'
    ];
    
    const csvContent = [headers.join(','), ...exampleData].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const filename = 'product_import_template.csv';
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
