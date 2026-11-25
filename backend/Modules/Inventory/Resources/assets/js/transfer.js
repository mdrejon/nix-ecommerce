'use strict';
if ($('.main-body .page-wrapper').find('#transfer-add-container').length || $('.main-body .page-wrapper').find('#transfer-edit-container').length) {

    var stack = [];

    if ($('.main-body .page-wrapper').find('#transfer-add-container').length) {
        $('input[name="arrival_date"]').daterangepicker(dateSingleConfig());
    }

    if ($('.main-body .page-wrapper').find('#transfer-edit-container').length) {
        $('input[name="arrival_date"]').daterangepicker(dateSingleConfig($('input[name="arrival_date"]').val()));
        stack = typeof editStack === 'string' ? JSON.parse(editStack) : (Array.isArray(editStack) ? editStack : []);
    }

    function in_array(search, array) {
        var i;
        for (i = 0; i < array.length; i++) {
            if(array[i] ==search ) {
                return true;
            }
        }
        return false;
    }

    function checkProductTableData()
    {
        if ($('.closeRow').length == 0) {
            $('#product-table').addClass('display_none');
        } else {
            $('#product-table').removeClass('display_none');
        }
    }

    function autoCompleteSource(request, response, url) {

        if ($('#vendor_id').val() == '') {
            $('#error_message').text(jsLang('Please select vendor!'));
            return false;
        } else if ($('#from_location_id').val() == '') {
            $('#error_message').text(jsLang('Please select origin!'));
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
                vendorId : $('#vendor_id').val(),
                fromLocationId : $('#from_location_id').val(),
            },
            success: function (data) {
                if (data.status == 1) {
                    var data = data.products;
                    $('#no_div').css('display', 'none');
                    response($.map(data, function (products) {
                        return {
                            id: products.id,
                            value: products.name,
                            qty: products.total_quantity,
                            sku: products.sku
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

    function appendTransferProductRow(product)
    {
        if (!product || !product.id) {
            return;
        }

        if (!in_array(product.id, stack)) {
            stack[product.id] = product.id;
            let productName = product.value ?? product.text ?? '';
            let productSku = product.sku ?? '';
            let productQty = product.qty ?? 0;

            var new_row = `<tbody id="rowId-${rowNo}" class="transfer_products product-list-tbody">
                          <input type="hidden" name="product_id[]" value="${product.id}">
                          <tr class="itemRow product-list product-list-tr rowNo-${rowNo}" id="productId-${product.id}" data-row-no="${rowNo}">
                              <td class="pl-1">
                                  <div class="text-start mv-purchase-product-cell">
                                      <label class="d-md-none text-muted small mb-1">${jsLang('Product')}</label>
                                      <div class="mv-purchase-product-name">${productName}</div>
                                  </div>
                              </td>
                              <td class="sup_sku">
                                  <div>
                                      <label class="d-md-none text-muted small">${jsLang('SKU')}</label>
                                      <input id="sku_${rowNo}" class="form-control text-center" type="text" readonly value="${productSku}">
                                  </div>
                              </td>
                              <td class="productQty">
                                  <div>
                                      <label class="d-md-none text-muted small">${jsLang('Quantity')}</label>
                                      <input name="product_qty[]" id="product_qty_${rowNo}" class="inputQty form-control text-center" type="number" value="1" data-rowId=${rowNo} max="${productQty}">
                                  </div>
                              </td>
                              <td class="text-center padding_top_15px">
                                  <div class="product-list-delete">
                                      <a href="javascript:void(0)" class="closeRow w-100 d-inline-block" data-row-id="${rowNo}" data-id="${product.id}">
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

        $('#productId-' + product.id).find('.inputQty').trigger("blur");
    }

    function productSearchPreCheck()
    {
        if ($('#vendor_id').val() == '') {
            $('#error_message').text(jsLang('Please select vendor!'));
            return false;
        } else if ($('#from_location_id').val() == '') {
            $('#error_message').text(jsLang('Please select origin!'));
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
                    url: SITE_URL + '/inventory/transfer/product-search',
                    dataType: 'json',
                    delay: 350,
                    type: 'POST',
                    data: function (params) {
                        return {
                            _token: token,
                            search: params.term && params.term.length ? params.term : ' ',
                            vendorId: $('#vendor_id').val(),
                            fromLocationId: $('#from_location_id').val()
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
                                    qty: product.total_quantity,
                                    sku: product.sku,
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
                appendTransferProductRow(event.params.data);
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
                    autoCompleteSource(request, response, SITE_URL + '/inventory/transfer/product-search');
                },
                select: function (event, ui) {
                    appendTransferProductRow(ui.item);
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

    locationSelect2Define();

    function locationSelect2Define()
    {
        $(".location").select2({
            ajax: {
                url: SITE_URL + '/inventory/find-location-with-ajax',
                dataType: "json",
                delay: 250,
                data: function (params) {
                    return {
                        q: params.term, // search term
                        page: params.page,
                        vendorId: $('#vendor_id').val(),
                        from_location_id : $('#from_location_id').val(),
                        to_location_id : $('#to_location_id').val()
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

            escapeMarkup: function (markup) {
                return markup;
            },
            minimumInputLength: 3,
            allowClear: true
        });

        $(".location").on('select2:open', function () {
            const $parent = $(this).parent();
            const $input = $parent.find('.select2-search__field');
            const input = $input.length ? $input : $('.select2-search__field');
            
            if (input.val().length === 0) {
                input.val('   ').trigger('input'); // Trigger empty fetch
                input.val('');
            }
        });
    }

    if ($('.main-body .page-wrapper').find('#transfer-add-container').length && $('#vendor_id').is('select')) {
        initializeSelect2Ajax('#vendor_id', SITE_URL + '/inventory/find-vendor-with-ajax', jsLang("Search for vendor by name"));
    }

    $(document).on('keyup change', '.inputQty', function() {
        let maxVal = parseFloat($(this).attr('max'));

        $(this).val(parseInt($(this).val()));
        
        if (parseFloat($(this).val()) > maxVal) {
            $(this).val(maxVal);
        }
        
        if (parseFloat($(this).val()) < 0) {
            $(this).val(0);
        }
    });

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
    });

    $('#vendor_id').on('change', function() {
        $('.transfer_products').remove();
        stack = [];
        $('#from_location_id').val(null).trigger('change');
        checkProductTableData();
    });

    $('#from_location_id').on('change', function() {
        $('.transfer_products').remove();
        stack = [];
        checkProductTableData();
    });
}

$(document).ready(function () {
    if (typeof shippingProviderUrl !== 'undefined') {
        initializeSelect2Ajax('.shipping-provider-ajax', shippingProviderUrl, jsLang("Search shipping provider"));
    }
})
