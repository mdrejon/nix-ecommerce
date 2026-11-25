"use strict";

$(function () {
    $('.barcode-print-action').on('click', function () {
        printBarcodes(
            $(this).data('print-size'),
            $(this).data('barcode-margin'),
            $(this).data('barcode-bottom-margin')
        );
    });

    function printBarcodes(size, configuredMargin, configuredBottomMargin) {
        if (size !== 'a4' && size !== '58mm' && size !== '78mm') {
            return;
        }

        var margin = normalizeMargin(configuredMargin, 2);
        var bottomMargin = normalizeMargin(configuredBottomMargin, 0);

        var columns = size === 'a4' ? 3 : 1;
        var $printOutput = $('<div>', {
            class: 'barcode barcode-print-output barcode-print-output--' + size,
        });
        var $grid = $('<div>', { class: 'barcode-print-grid' });

        $('#barcode-generate-container .barcode .mv-barcode-preview__cell').each(function () {
            $grid.append($('<div>', { class: 'barcode-print-cell' }).append($(this).clone()));
        });

        $printOutput
            .attr('data-columns', columns)
            .append($grid)
            .appendTo('body');

        $printOutput.printArea({
            mode: 'iframe',
            popClose: false,
            extraHead: '<style>' + printStyles(size, columns, margin, bottomMargin) + '</style>',
        });

        if (!isA4Size(size)) {
            setThermalPageHeight(size, bottomMargin);
        }

        // PrintArea reads the content synchronously before opening its iframe.
        setTimeout(function () {
            $printOutput.remove();
        }, 1500);
    }

    function isA4Size(size) {
        return size === 'a4';
    }

    function normalizeMargin(value, fallback) {
        var margin = Number.parseFloat(value);

        if (!Number.isFinite(margin)) {
            return fallback;
        }

        return Math.min(50, Math.max(0, margin));
    }

    function setThermalPageHeight(size, bottomMargin) {
        // PrintArea creates the iframe synchronously and waits one second before
        // opening the browser print dialog. Measure after linked styles and
        // barcode images have settled so every label stays on one roll page.
        setTimeout(function () {
            var $frame = $('iframe[id^="printArea_"]').last();
            var frameDocument = $frame.length ? $frame[0].contentDocument : null;
            var output = frameDocument
                ? frameDocument.querySelector('.barcode-print-output')
                : null;
            var lastCell = frameDocument
                ? frameDocument.querySelector('.barcode-print-cell:last-child')
                : null;

            if (!output || !lastCell || !frameDocument.head) {
                return;
            }

            var outputTop = output.getBoundingClientRect().top;
            var contentBottom = lastCell.getBoundingClientRect().bottom;
            var heightPixels = Math.max(0, contentBottom - outputTop);
            var paperWidthMillimeters = Number.parseFloat(size);
            var contentHeightMillimeters =
                Math.ceil((heightPixels * 25.4 / 96) * 10) / 10;
            var heightMillimeters = Math.max(
                Number.isFinite(paperWidthMillimeters)
                    ? paperWidthMillimeters + 0.1
                    : 10,
                contentHeightMillimeters
            ) + bottomMargin;
            var pageStyle = frameDocument.createElement('style');

            pageStyle.textContent =
                '@page{size:' + size + ' ' + heightMillimeters + 'mm;margin:0;}' +
                'html,body{min-height:0!important;}';
            frameDocument.head.appendChild(pageStyle);
        }, 700);
    }

    function printStyles(size, columns, margin, bottomMargin) {
        var isA4 = isA4Size(size);
        var paperWidthMillimeters = Number.parseFloat(size);
        var barcodeMaxWidth = isA4 || !Number.isFinite(paperWidthMillimeters)
            ? 'calc(100% - 8mm)'
            : Math.max(10, paperWidthMillimeters - 8) + 'mm';
        var pageRule = isA4
            ? '@page{size:A4 portrait;margin:10mm;}'
            : '@page{margin:0;}';

        // Thermal printers set the roll height themselves. Defining a one-value
        // @page size makes Chromium treat it as a square sheet, which creates
        // the large blank area visible in the print preview.
        return pageRule +
            'html,body{width:100%!important;margin:0!important;padding:0!important;background:#fff!important;height:auto!important;vertical-align:top!important;}' +
            '.barcode-print-output{display:block!important;width:100%!important;max-width:none!important;box-sizing:border-box!important;margin:0!important;padding:0!important;page-break-after:auto!important;font-family:Arial,sans-serif;vertical-align:top!important;}' +
            '.barcode-print-grid{display:grid!important;width:100%!important;max-width:none!important;box-sizing:border-box!important;grid-template-columns:repeat(' + columns + ',minmax(0,1fr));grid-auto-flow:row!important;align-content:start!important;align-items:start!important;justify-content:center!important;gap:' + margin + 'mm;}' +
            '.barcode-print-cell{width:100%!important;box-sizing:border-box;text-align:center!important;vertical-align:top!important;align-self:start!important;break-inside:avoid;page-break-inside:avoid;padding:' + (isA4 ? '2mm 0' : '1mm 0') + ';}' +
            '.barcode-print-cell:last-child{padding-bottom:0!important;margin-bottom:0!important;}' +
            '.barcode-print-cell .mv-barcode-preview__cell{display:flex!important;width:100%!important;max-width:none!important;box-sizing:border-box!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;padding:0!important;text-align:center!important;vertical-align:top!important;}' +
            '.barcode-print-cell img{max-width:100%!important;height:auto!important;}' +
            '.barcode-print-cell .barcode_image{display:block!important;width:100%!important;max-width:' + barcodeMaxWidth + '!important;margin:0 auto!important;}' +
            '.barcode-print-cell .barcode_image img{display:block!important;width:auto!important;max-width:100%!important;height:auto!important;object-fit:contain!important;margin:0 auto!important;}' +
            '.barcode-print-cell .barcode_site,.barcode-print-cell .barcode_name,.barcode-print-cell .barcode_price{display:block;font-size:10px;line-height:1.25;}' +
            '.barcode-print-cell .barcode_price{color:#111827!important;font-size:14px!important;font-weight:700!important;}';
    }
});
