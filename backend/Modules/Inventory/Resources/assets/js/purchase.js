'use strict';
if ($('.main-body .page-wrapper').find('#purchase-add-container').length || $('.main-body .page-wrapper').find('#purchase-edit-container').length) {
    var stack = [];
    
    if ($('.main-body .page-wrapper').find('#purchase-add-container').length) {
        $('input[name="arrival_date"]').daterangepicker(dateSingleConfig());
        $('input[name="purchase_date"]').daterangepicker(dateSingleConfig());
    }

    if ($('.main-body .page-wrapper').find('#purchase-edit-container').length) {
        $('input[name="arrival_date"]').daterangepicker(dateSingleConfig($('input[name="arrival_date"]').val()));
        $('input[name="purchase_date"]').daterangepicker(dateSingleConfig($('input[name="purchase_date"]').val()));
        stack = JSON.parse(editStack);
    }

    $("#purchase_form").on('submit', function(event) {
        if ($('.itemRow').length == 0) {
            event.preventDefault();
            $('#error_message').text(jsLang('Please add product!'));
        }
    });
    
    $("#settings_modal").on("click", function () {
        $('.adjustRow').remove();
        
        if ($('.cost_management_val').length == 0) {
            totalAmount -= parseFloat($('#cost_management_shipping').text());
        }
        $('#adjust_shipping_amount').val(parseFloat($('#cost_management_shipping').text()));
        
        addedAdjustModalData();
        
        $('#myModal').modal('show');
    });
    
    function addedAdjustModalData()
    {
        let adjustHtmlData = ``;
        $('.cost_management_lbl').each(function(i, v) {
            adjustHtmlData += adjustHtml($(this).text(), $(this).next('.cost_management_val').text());
        });
        
        $('#adjust_table').append(adjustHtmlData);
    }
    
    function adjustHtml(select = '', amountVal = 0)
    {
        return `<tr class="adjustRow">
                <td class="text-center">
                 <select class="form-control inputAdjustField" name="adjustment[name][]">
                    <option value="" ${select == '' ? 'selected' : ''}>${ jsLang('Select One')  }</option>
                    <option value="Custom Duty" ${select == 'Custom Duty' ? 'selected' : ''}>${ jsLang('Custom Duty')  }</option>
                    <option value="Discount" ${select == 'Discount' ? 'selected' : ''}>${ jsLang('Discount')  }</option>
                    <option value="Foreign Transaction Fee" ${select == 'Foreign Transaction Fee' ? 'selected' : ''}>${ jsLang('Foreign Transaction Fee')  }</option>
                    <option value="Freight Fee" ${select == 'Freight Fee' ? 'selected' : ''}>${ jsLang('Freight Fee')  }</option>
                    <option value="Insurance" ${select == 'Insurance' ? 'selected' : ''}>${ jsLang('Insurance')  }</option>
                    <option value="Rush Fee" ${select == 'Rush Fee' ? 'selected' : ''}>${ jsLang('Rush Fee')  }</option>
                    <option value="Surcharge" ${select == 'Surcharge' ? 'selected' : ''}>${ jsLang('Surcharge')  }</option>
                    <option value="Other" ${select == 'Other' ? 'selected' : ''}>${ jsLang('Other')  }</option>
                  </select>
                  </td>
                  <td class="text-center">
                    <input name="adjustment[amount][]" class="inputAdjustAmount inputFieldDesign form-control text-center positive-float-number" type="text"  value="${amountVal}">
                  </td>
                  <td class="text-center padding_top_18px">
                      <a href="javascript:void(0)" class="closeAdjust"><i class="feather icon-trash"></i></a>
                  </td>
                </tr>`;
    }

    function autoCompleteSource(request, response, url) {

        if ($('#vendor_id').val() == '') {
            $('#error_message').text(jsLang('Please select vendor!'));
            return false;
        } else if ($('#location_id').val() == '') {
            $('#error_message').text(jsLang('Please select location!'));
            return false;
        } else {
            $('#error_message').text('');
        }
        
        $.ajax({
            url: url,
            dataType: "json",
            type: "POST",
            data: {
                _token: token,
                search: request.term,
                vendorId : $('#vendor_id').val()
            },
            success: function (data) {
                if (data.status == 1) {
                    var data = data.products;
                    $('#no_div').css('display', 'none');
                    response($.map(data, function (products) {
                        return {
                            id: products.id,
                            value: products.name,
                            unit: products.unit ?? products.default_unit,
                            purchase_price: products.purchase_price ?? 0
                        }
                    }));
                } else {
                    $('.ui-menu-item').remove();
                    $("#no_div").css('top', $("#search").position().top + 35);
                    $("#no_div").css('left', $("#search").position().left);
                    $("#no_div").css('width', $("#search").width());
                    $("#no_div").css('display', 'block');
                }
                //end
            }
        })
    }

    /**
     * AutoComplete Stack is empty or not
     * @param  int rowNo
     * @param  string type
     * @return boolean
     */
    function checkStack(rowNo, type = null) {
        if(stack && stack.length != 0) {
            if (type == "purchase_add") {
                if ($('#reference_no').val() != null && $('#reference_no').val() != '') {
                    $("#btnSubmit").prop("disabled",false);
                }
            } else {
                $("#btnSubmit").prop("disabled", false);
            }
        }
        $(".addRow").attr("data-row-no", rowNo);
        $(".addRowContainer").attr("id", "addRow-" + rowNo);
        return false;
    }
    
    /**
     * User selected any item or not
     * @param  string message
     * @param  string selector
     * @return boolean
     */
    function checkItemSelected(message, selector = ".itemRow") {
        if ($(selector).length < 1) {
            swal(jsLang(message), {
                icon: "error",
                buttons: [false, jsLang('Ok')],
            });
            return false;
        }
    }

    /**
     * in_array functionalities
     * @param  string search
     * @param  array array
     * @return void
     */
    function in_array(search, array) {
        var i;
        for (i = 0; i < array.length; i++) {
            if(array[i] ==search ) {
                return true;
            }
        }
        return false;
    }
    function appendPurchaseProductRow(product)
    {
        if (!product || !product.id) {
            return;
        }

        if (!in_array(product.id, stack)) {
            stack[product.id] = product.id;
            let productName = product.value ?? product.text ?? '';
            let productUnit = product.unit ?? '';
            let productPurchasePrice = parseFloat(product.purchase_price ?? 0) || 0;
            var new_row = `<tbody id="rowId-${rowNo}" class="purchase_products product-list-tbody">
                <input type="hidden" name="product_id[]" value="${product.id}">
                <tr class="itemRow product-list product-list-tr rowNo-${rowNo}" id="productId-${product.id}"  data-row-no="${rowNo}">
                    <td class="pl-1">
                        <div class="text-start mv-purchase-product-cell">
                            <label class="d-md-none text-muted small mb-1">${jsLang('Product')}</label>
                            <input type="hidden" name="product_name[]" value="${productName}">
                            <div class="mv-purchase-product-name">${productName}</div>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex justify-content-between justify-content-md-end">
                            <span class="d-md-none text-muted small">${jsLang('Unit')}</span>
                            <span class="text-end text-md-center d-inline d-md-block w-100">
                                <input type="hidden" name="product_unit[]" value="${productUnit}">
                                ${productUnit}
                            </span>
                        </div>
                    </td>
                    <td class="sup_sku">
                        <div>
                            <label class="d-md-none text-muted small">${jsLang('Supplier SKU')}</label>
                            <input name="sup_sku[]" id="sup_sku_${rowNo}" class="form-control text-center" type="text">
                        </div>
                    </td>
                    <td class="productQty">
                        <div>
                            <label class="d-md-none text-muted small">${jsLang('Quantity')}</label>
                            <input name="product_qty[]" id="product_qty_${rowNo}" class="inputQty form-control text-center positive-float-number" type="text" value="1" data-rowId = ${rowNo}>
                        </div>
                    </td>
                    <td class="productCost">
                        <div>
                            <label class="d-md-none text-muted small">${jsLang('Cost')}</label>
                            <input id="product_cost_${rowNo}" name="product_cost[]" class="inputCost form-control text-center positive-float-number" type="text"  value="${productPurchasePrice}">
                        </div>
                    </td>
                    <td class="productTax min-width-145">
                        <div>
                            <label class="d-md-none text-muted small">${jsLang('Tax')} %</label>
                            <input  id="product_tax_${rowNo}" type="text" class="inputTax form-control text-center positive-float-number" name="product_tax[]" value="0">
                        </div>
                    </td>
                    <td class="productAmount">
                        <div>
                            <label class="d-md-none text-muted small">${jsLang('Total')} %</label>
                            <span class="form-control text-center" id="product_amount_${rowNo}">0</span>
                        </div>
                    </td>
                    <td class="text-center padding_top_15px">
                        <div class="product-list-delete">
                            <a href="javascript:void(0)" class="closeRow" data-row-id="${rowNo}" data-id="${product.id}">
                            <i class="feather icon-trash"></i>
                            <span class="d-md-none">${jsLang('Delete')}</span>
                            </a>
                        </div>
                    </td>
                </tr>
            </tbody>`;
            $('#product-table').append(new_row);
            checkProductTableData();
            rowNo++;
        }

        $('#productId-' + product.id).find('.inputQty').trigger("change");
    }

    function productSearchPreCheck()
    {
        if ($('#vendor_id').length && $('#vendor_id').val() == '') {
            $('#error_message').text(jsLang('Please select vendor!'));
            return false;
        }

        if ($('#location_id').val() == '') {
            $('#error_message').text(jsLang('Please select location!'));
            return false;
        }

        $('#error_message').text('');
        return true;
    }

    if ($("#search").length > 0) {
        if ($('#search').is('select')) {
            $("#search").select2({
                width: '100%',
                placeholder: $('#search').data('placeholder') || jsLang('Search for product by name'),
                minimumInputLength: 0,
                ajax: {
                    url: SITE_URL + '/inventory/purchase/product-search',
                    dataType: 'json',
                    delay: 350,
                    type: 'POST',
                    data: function (params) {
                        return {
                            _token: token,
                            search: params.term && params.term.length ? params.term : ' ',
                            vendorId: $('#vendor_id').val()
                        };
                    },
                    processResults: function (data) {
                        let results = [];

                        if (data.status == 1 && Array.isArray(data.products)) {
                            results = $.map(data.products, function (product) {
                                return {
                                    id: product.id,
                                    text: product.name,
                                    value: product.name,
                                    unit: product.unit ?? product.default_unit,
                                    purchase_price: product.purchase_price ?? 0,
                                    disabled: in_array(product.id, stack)
                                };
                            });
                        }

                        return {
                            results: results
                        };
                    },
                    transport: function (params, success, failure) {
                        if (!productSearchPreCheck()) {
                            success({ status: 1, products: [] });
                            return null;
                        }

                        let request = $.ajax(params);
                        request.then(success);
                        request.fail(failure);
                        return request;
                    }
                },
                language: {
                    inputTooShort: function () {
                        return jsLang('Start typing to search...');
                    },
                    noResults: function () {
                        return productSearchPreCheck() ? jsLang('No data found') : '';
                    },
                    searching: function () {
                        return jsLang('Searching...');
                    }
                }
            });

            $('#search').on('select2:opening', function (event) {
                if (!productSearchPreCheck()) {
                    event.preventDefault();
                }
            });

            $('#search').on('select2:select', function (event) {
                appendPurchaseProductRow(event.params.data);
                $(this).val(null).trigger('change');
                $(this).find('option').not(':first').remove();
            });

            $('#search').on('select2:open', function () {
                const input = $(this).parent().find('.select2-search__field');
                if (input.length) {
                    input.trigger('focus');
                    if (input.val().length === 0) {
                        input.val(' ').trigger('input');
                        input.val('');
                    }
                }
            });
        } else {
            $("#search").autocomplete({
                delay: 500,
                position: {my: "left top", at: "left bottom", collision: "flip"},
                source: function (request, response) {
                    autoCompleteSource(request, response, SITE_URL + '/inventory/purchase/product-search');
                },
                select: function (event, ui) {
                    appendPurchaseProductRow(ui.item);
                    $('#search').val('').blur();
                    return false;
                },
                minLength: 1,
                autoFocus: true
            }).autocomplete( "instance" )._renderItem = function( ul, item ) {
                if (!in_array(item.id, stack)) {
                    return $( "<li>" )
                        .append( "<div>" + item.value + "</div>" )
                        .appendTo( ul );
                } else {
                    return $( "<li style='pointer-events:none;opacity:0.6;'>" )
                        .append( "<div>" + item.value + "</div>" )
                        .appendTo( ul );
                }
            };

            $('#search').on('focus', function () {
                if ($(this).val().trim() === '') {
                    $(this).autocomplete("search", " ");
                }
            });
        }
    }

    if ($('.main-body .page-wrapper').find('#purchase-add-container').length) {
        supplierSelect2Define();
        locationSelect2Define();
    }
    
    function supplierSelect2Define()
    {
        var supplierSelectVendorMessage = jsLang('Please select vendor first.');
        var supplierNoDataMessage = jsLang('No data found');
        var supplierAddNewMessage = jsLang('Add New Supplier');

        $("#supplier_id").select2({
            ajax: {
                url: SITE_URL + '/inventory/find-supplier-with-ajax',
                dataType: "json",
                delay: 250,
                data: function (params) {
                    return {
                        q: params.term, // search term
                        page: params.page,
                        vendorId: $('#vendor_id').val(),
                    };
                },
                processResults: function (data, params) {
                    let results = data.data;
                    return {
                        results: results
                    };
                },
                cache: true,
            },
            placeholder: jsLang("Search for supplier by name."),
            language: {
                noResults: function() {
                    if ($('#vendor_id').val() === '') {
                        return `<div><label>${supplierSelectVendorMessage}</label></div>`;
                    }

                    return `<div>
                          <label>${supplierNoDataMessage}</label>
                          <br>
                            <a class="options-add-two mt-2 float-right" id="supplier_modal" style="margin-bottom: 12px !important;margin-top: -8px !important;">
                              ${supplierAddNewMessage}
                            </a>
                         </div>
            </li>`;
                }
            },

            escapeMarkup: function (markup) {
                return markup;
            },
            minimumInputLength: 3,
        });

        $('#supplier_id').on('select2:open', function () {
            const input = $('.select2-search__field');
            if (input.val().length === 0) {
                input.val('   ').trigger('input'); // Trigger empty fetch
                input.val('');
            }
        });
    }
    
    function locationSelect2Define()
    {
        $("#location_id").select2({
            ajax: {
                url: SITE_URL + '/inventory/find-location-with-ajax',
                dataType: "json",
                delay: 250,
                data: function (params) {
                    return {
                        q: params.term, // search term
                        page: params.page,
                        vendorId: $('#vendor_id').val(),
                    };
                },
                processResults: function (data, params) {
                    let results = data.data;
                    return {
                        results: results
                    };
                },
                cache: true,
            },
            placeholder: jsLang("Search for location by name."),
            language: {
                noResults: function() {
                    return `<div>
                          <label>${jsLang('No data found')}</label>
                          <br>
                            <a class="options-add-two mt-2 float-right" id="location_modal" style="margin-bottom: 12px !important;margin-top: -8px !important;">
                              ${jsLang('Add New Location')}
                            </a>
                         </div>
            </li>`;
                }
            },

            escapeMarkup: function (markup) {
                return markup;
            },
            minimumInputLength: 3,
        });

        $('#location_id').on('select2:open', function () {
            const input = $('.select2-search__field');
            if (input.val().length === 0) {
                input.val('   ').trigger('input'); // Trigger empty fetch
                input.val('');
            }
        });
    }
    

    if ($('.main-body .page-wrapper').find('#purchase-add-container').length) {
        $("#vendor_id").select2({
            ajax: {
                url: SITE_URL + '/inventory/find-vendor-with-ajax',
                dataType: "json",
                delay: 250,
                data: function (params) {
                    return {
                        q: params.term, // search term
                        page: params.page,
                    };
                },
                processResults: function (data, params) {
                    let results = data.data;
                    return {
                        results: results
                    };
                },
                cache: true,
            },
            placeholder: jsLang("Search for vendor by name."),
            minimumInputLength: 3,
        });

        $('#vendor_id').on('select2:open', function () {
            const input = $('.select2-search__field');
            if (input.val().length === 0) {
                input.val('   ').trigger('input'); // Trigger empty fetch
                input.val('');
            }
        });
    }

    $(document).on('change', '.inputQty, .inputCost, .inputTax', function() {        
        PurchaseCalculation();
    });
    
    function PurchaseCalculation()
    {
        let subtotalTax = 0;
        let subtotal = 0;
        
        $('.inputQty').each(function(i, v) {
            let rowId = $(this).attr('data-rowId');
            
            let qtyId = '#product_qty_'+rowId;
            let costId = '#product_cost_'+rowId;
            let amountId = '#product_amount_'+rowId;
            let taxId = '#product_tax_'+rowId;
            
            const validateNumber = (number) => thousandSeparator === '.' ? parseFloat(number.replace(/\./g, '')) : parseFloat(number.replace(/,/g, ''));
            const parseValue = (selector) => parseFloat(validateNumber($(selector).val())) || 0;

            const productQuantity = parseValue(qtyId);
            const productCostPerUnit = parseValue(costId);
            const taxRate = parseValue(taxId);

            const productCost = productQuantity * productCostPerUnit;
            const taxAmount = (productCost * taxRate) / 100;

            subtotalTax += taxAmount;

           let productAmount = productCost + taxAmount;
           
            subtotal += productAmount;
            $(amountId).text(getDecimalNumberFormat(productAmount));
        });
        
        $('#subTotalTax').text(getDecimalNumberFormat(subtotalTax));
        $('#subTotalAmount').text(getDecimalNumberFormat(subtotal));
        totalAmount = subtotal;

        costManagement(false);
        
        updateTotalAmount(totalAmount);
        
    }
    
    function updateTotalAmount(amount)
    {
        $('#totalAmount').text(getDecimalNumberFormat(amount));
    }

    $(document).on("click", ".closeRow", function (e) {
        e.preventDefault();
        let selector = '#rowId-'+$(this).attr("data-row-id");
        let pId= $(this).attr('data-id');
        let i = 0;
        $(selector).remove();

        for (i = 0; i < stack.length; i++) {
            if(stack[i] == pId ) {
                stack.splice(i, 1, 0);
            }
        }
        

        
        checkProductTableData();
        PurchaseCalculation();
    });
    
    function checkProductTableData()
    {
        if ($('.closeRow').length == 0) {
            $('#product-table').addClass('display_none');
        } else {
            $('#product-table').removeClass('display_none');
        }
    }    

    $('#vendor_id').on('change', function() {
        $('.purchase_products').remove();
        $('#location_id').val(null).trigger('change');
        $('#supplier_id').val(null).trigger('change');
        $('#supplier_add_vendorId').val($(this).val());
        $('#location_add_vendorId').val($(this).val());
        stack = [];
        checkProductTableData();

        fetchVendorDefaultLocation($(this).val());

    });

    function fetchVendorDefaultLocation(vendorId)
    {
        if (vendorId) {
            $.ajax({
                url: SITE_URL + '/inventory/find-vendor-default-location-with-ajax',
                dataType: "json",
                type: "POST",
                data: {
                    _token: token,
                    vendorId: vendorId
                },
                success: function (data) {
                    if (data.status == 200) {
                        $('#location_id').append(new Option(data.location.name, data.location.id, true, true))
                            .trigger('change');
                    }
                }
            })
        };
    }

    $('#location_id').on('change', function() {
        $('.purchase_products').remove();
        stack = [];
        checkProductTableData();
    });
    
    $('#adjustmentBtn').on('click', function() {
        $('#adjust_table').append(adjustHtml());
    });

    $(document).on("click", ".closeAdjust", function (e) {
        e.preventDefault();
        $(this).parent().parent().remove();
    });

    $(document).on("click", ".close", function (e) {
        e.preventDefault();
        $('#myModal').modal('hide');
    });

    $('#adjustSave').on('click', function() {
        
        if ($('.itemRow').length == 0) {
            triggerNotification(jsLang('Please add product first!'));
            return;
        }
        
        if ($('.customHtml').length > 0) {
            
            $('.cost_management_val').each(function(i, v){
                totalAmount -= parseFloat($(this).text() ? $(this).text() : 0);
            });

            totalAmount -= parseFloat($('#cost_management_shipping').text() ? $('#cost_management_shipping').text() : 0);
            
            $('.customHtml').remove();
        }
        
        let shippingValue = parseFloat($('#adjust_shipping_amount').val() ? $('#adjust_shipping_amount').val() : 0);
        totalAmount += shippingValue;
        $('#cost_management_shipping').text(shippingValue);

        costManagement();
        updateTotalAmount(totalAmount);
        $('#myModal').modal('hide');
    });
    
    function costManagement(isApend = true)
    {
        let costHtml = ``;
        $('.inputAdjustField').each(function(i, v) {
            if ($(this).val()) {
                let adjustVal = parseFloat($(this).closest('td').next().find('input.inputAdjustAmount').val() ? $(this).closest('td').next().find('input.inputAdjustAmount').val() : 0);
                totalAmount += adjustVal;
                costHtml += `
                <div class="d-flex justify-content-between align-items-center customHtml">
                    <span class="text-muted small cost_management_lbl">${ $(this).val() ? $(this).val() : '' }</span>
                    <span class="fw-semibold cost_management_val">${getDecimalNumberFormat(adjustVal)}</span>
                </div>
                `;
            }
        });
        
        if (isApend) {
            $('#cost_management').append(costHtml);
        } else {
            totalAmount += parseFloat($('#adjust_shipping_amount').val() ? $('#adjust_shipping_amount').val() : 0);
        }
    }

    $(document).on('change', '.inputAdjustAmount', function() {
        let selectVal = $(this).closest('td').prev().find('select.inputAdjustField').val();
        
        if (selectVal == 'Discount') {
            let val = $(this).val() ? $(this).val() : 0;
            $(this).val((-val));
        }
        
    });
    

    const triggerNotification = (msg) => {
        $(".notification-msg-bar").find(".notification-msg").html(msg);
        $(".notification-msg-bar").removeClass("smoothly-hide");
        setTimeout(() => {
            $(".notification-msg-bar").addClass("smoothly-hide"),
                $(".notification-msg-bar").find(".notification-msg").html("");
        }, 2500);
    };


    $(document).on('click', '#supplier_modal', function() {

        supplierSelect2Define();
        
        
        $('#addSupplier').modal('show');
    });

    $(".supplierModalClose").on("click", function () {
        $('#addSupplier').modal('hide');
    });

    $(document).on('click', '#location_modal', function() {
        locationSelect2Define();
        $('#addLocation').modal('show');
    });

    $(".locationModalClose").on("click", function () {
        $('#addLocation').modal('hide');
    });


    
    $('#location_country').on('change', function() {
        getLocationState($('#location_country').find(':selected').attr('data-country'));
    });

    function getLocationState( country_code ) {
        if (country_code) {
            $("#location_state").html('');
            $.ajax({
                url: url + "/geo-locale/countries/" + country_code + "/states",
                type: "GET",
                dataType: 'json',
                beforeSend: function() {
                    $('#location_state').attr('disabled','true');
                    $('#location_state').html(loader);
                },
                success: function(result) {
                    $('#location_state').html(selectState);

                    $.each(result.data, function(key, value) {
                        $("#location_state").append(`'<option ${value.code==oldState?'Selected': ''} data-state="${value.code}" value="${value.code}">${value.name}</option>'`);
                    });

                    $("#location_state").removeAttr("disabled");

                    if (result.length <= 0 && result.data.length <= 0) {
                        errorMsg = errorMsg.replace(":x", 'State');
                        $('#location_state').html(`<option value="">${errorMsg}</option>`);
                    }
                }
            });
        } else {

            $('#location_state').html(selectState);
            $('#location_city').html(selectCity);
        }
    }

    $('#location_state').on('change', function() {
        getLocationCity($('#location_state').find(':selected').attr('data-state'), $('#location_country').find(':selected').attr('data-country'));
    });

    function getLocationCity( siso, ciso) {

        if (siso && ciso) {
            $("#location_city").html('');
            $.ajax({
                url: url + "/geo-locale/countries/" + ciso + "/states/" + siso +
                    "/cities",
                type: "GET",
                dataType: 'json',
                beforeSend: function() {
                    $('#location_city').html(loader);
                    $('#location_city').attr('disabled','true');
                },
                success: function(res) {
                    $('#location_city').html(selectCity);
                    $.each(res.data, function(key, value) {
                        $("#location_city").append(`<option ${value.name == oldCity ? 'Selected': ''} value="${value.name}">${value.name}</option>`);
                    });
                    $("#location_city").removeAttr("disabled");
                    if (res.length <= 0 && res.data.length <= 0) {
                        errorMsg = errorMsg.replace(":x", 'City');
                        $('#location_city').html(`<option value="">${errorMsg}</option>`);
                    }
                }
            });

        } else {
            $('#location_city').html(selectCity);
        }
    }


    $("#supplierFrom").on('submit', function(event) {
        event.preventDefault();
        addedLocationSupplier(addSupplierUrl, new FormData(this), '#addSupplier', '#supplier_id', '#supplierFrom');
    });

    $("#locationFrom").on('submit', function(event) {
        event.preventDefault();
        addedLocationSupplier(addLocation, new FormData(this), '#addLocation', '#location_id', '#locationFrom');
    });
    
    function addedLocationSupplier(url, data, modalSelector, selector, formSelector)
    {
        $.ajax({
            type: 'POST',
            url: url,
            data:data,
            dataType:'JSON',
            contentType: false,
            cache: false,
            processData: false,
            success: function (data) {
                if (data.status == true) {
                    $(selector).append(`<option value="${data.response.id}" selected>${data.response.name}</option>`);
                    $(selector).trigger('change');
                    $(modalSelector).modal('hide');
                    triggerNotification(data.message);
                } else {
                    triggerNotification(data.message);
                }
            },
            complete: function() {

                $(formSelector).each(function(){
                    this.reset();
                });
            }
        });
    }
    
}

$(document).ready(function () {
    if (typeof shippingProviderUrl !== 'undefined') {
        initializeSelect2Ajax('.shipping-provider-ajax', shippingProviderUrl, jsLang("Search shipping provider"));
    }
})

if ($('.main-body .page-wrapper').find('#purchase-list-container').length) {
    $('#daterange-btn').daterangepicker(daterangeConfig(startDate, endDate), cbRange);
    cbRange(startDate, endDate);

    $(document).on("click", ".applyBtn, .ranges ul li:nth-child(1), .ranges ul li:nth-child(2), .ranges ul li:nth-child(3), .ranges ul li:nth-child(4), .ranges ul li:nth-child(5), .ranges ul li:nth-child(6), .ranges ul li:nth-child(7)", function (event) {
        event.preventDefault();
        let startFrom = $("#startfrom").val();
        let endto = $("#endto").val();
        var newOptions = {
            startFrom: startFrom,
        };
        var newOptionsTwo = {
            endto: endto,
        };
        let startDate = $("#start_date");
        let end_date = $("#end_date");
        startDate.empty(); // remove old options
        end_date.empty(); // remove old options
        $.each(newOptions, function (key, value) {
            startDate.append($("<option></option>")
                .attr("value", value).text(key));
        });
        $.each(newOptionsTwo, function (key, value) {
            end_date.append($("<option></option>")
                .attr("value", value).text(key));
        });
        $("#start_date option:first").attr('selected', 'selected');
        $("#end_date option:first").attr('selected', 'selected');
        $("#start_date").trigger("change");
    });
    
}
