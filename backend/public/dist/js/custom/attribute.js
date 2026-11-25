"use strict";

if (
    $(".main-body .page-wrapper").find("#attribute_group-add-container")
        .length ||
    $(".main-body .page-wrapper").find("#attribute_group-edit-container")
        .length ||
    $(".main-body .page-wrapper").find("#attribute-add-container").length ||
    $(".main-body .page-wrapper").find("#attribute-edit-container").length
) {
    var rowid = 2;
    if (
        $(".main-body .page-wrapper").find("#attribute-edit-container").length
    ) {
        rowid = $("#row_id").val();
    }

    if (
        $(".main-body .page-wrapper").find("#attribute-add-container").length ||
        $(".main-body .page-wrapper").find("#attribute-edit-container").length
    ) {
        $("#values").sortable({
            distance: 5,
            delay: 300,
            opacity: 0.6,
            cursor: "move",
            handle: ".handle",
            
        });
    }
    $(document).on("click", ".admin-save-action", function (event) {
        setTimeout(() => {
            if ($("#mv-attr-form-settings").length && $("#mv-attr-form-values").length) {
                const $settings = $("#mv-attr-form-settings");
                const $values = $("#mv-attr-form-values");
                if ($settings.find(".error").length > 0) {
                    document.getElementById("mv-attr-form-settings")?.scrollIntoView({ behavior: "smooth", block: "start" });
                } else if ($values.find(".error").length > 0) {
                    document.getElementById("mv-attr-form-values")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
                return;
            }
            const arr = ["v-pills-home-tab", "v-pills-profile-tab"];
            for (const key in arr) {
                const target = $(`.tab-pane[aria-labelledby="${arr[key]}"]`);
                if ($(target).find(".error").length > 0) {
                    $(`#${arr[key]}`).tab("show");
                    break;
                }
            }
        }, 100);
    });


    $(document).on("click", "#add-new-value", function (event) {
        event.preventDefault();
        addAttributeValue();
    });

    /**
     * Next row id for new value rows (create + edit attribute forms).
     */
    function syncRowIdFromDom() {
        var maxId = 0;
        $("#values tr[id^='rowid-']").each(function () {
            var n = parseInt(String(this.id).replace(/^rowid-/, ""), 10);
            if (!isNaN(n) && n > maxId) {
                maxId = n;
            }
        });
        rowid = maxId + 1;
    }

    /**
     * invalid does not bubble — use capture so dynamically added .attribute-value rows still get custom errors on submit.
     */
    document.addEventListener(
        "invalid",
        function (e) {
            var t = e.target;
            if (
                !t ||
                !t.classList ||
                !t.classList.contains("attribute-value") ||
                (!t.closest("#attribute-add-container") &&
                    !t.closest("#attribute-edit-container"))
            ) {
                return;
            }
            e.preventDefault();
            if (typeof checkValidity === "function") {
                checkValidity(t, { inErr: true });
            }
        },
        true
    );

    $(document).on(
        "input",
        "#attribute-add-container .attribute-value, #attribute-edit-container .attribute-value",
        function () {
            if (typeof checkValidity === "function") {
                checkValidity(this, { inErr: false });
            }
        }
    );

    function addAttributeValue() {
        let attributValue = `<tr draggable="false" id="rowid-${rowid}" class="mv-attr-values-table__row">
                                    <td class="mv-attr-values-table__handle handle text-center align-middle">
                                        <span class="mv-attr-values-table__drag" aria-hidden="true"><i class="fa fa-bars"></i></span>
                                    </td>
                                    <td class="mv-attr-values-table__cell mv-attr-values-table__cell--value align-top">
                                        <div class="form-group mv-mb-0 mv-attr-values-table__field">
                                            <input type="text" name="values[]" class="form-control form-width inputFieldDesign attribute-value" required
                                            oninvalid="this.setCustomValidity('${jsLang('This field is required.')}')"
                                            oninput="this.setCustomValidity('')"
                                            id="valueChk-${rowid}">
                                            <span id="value-text-${rowid}" class="validationMsg"></span>
                                            <input type="hidden" name="row_identify[]" value="${rowid}">
                                        </div>
                                    </td>
                                    <td class="colorCode mv-attr-values-table__cell mv-attr-values-table__cell--color align-top">
                                        <div class="form-group mv-mb-0 mv-attr-values-table__field">
                                            <input type="text" class="form-control form-width demo inputFieldDesign" data-control="hue" name="additional_values[]">
                                        </div>
                                    </td>
                                    <td class="text-end align-top mv-attr-values-table__actions mv-attr-values-table__cell mv-attr-values-table__cell--actions">
                                        <button type="button" class="admin-btn admin-btn-danger mv-attr-values-table__delete delete-row" data-row-id="${rowid}" data-bs-toggle="tooltip" data-bs-title="${jsLang('Delete Value')}" aria-label="${jsLang('Delete Value')}">
                                            <i class="feather icon-trash-2" aria-hidden="true"></i>
                                        </button>
                                    </td>
                                </tr>`;
        rowid++;

        $("#values").append(attributValue);
        if ($("#attrType").find(":selected").val() == "dropdown") {
            $(".colorCode").addClass("d-none");
        }
        initializeMinicolors();
    }

    function resetAttributeValues() {
        syncRowIdFromDom();
    }   

    $(document).ready(function(){
        var selectedValue = $("#attrType").val();
        if(selectedValue == 'dropdown'){
            $(".colorCode").addClass("d-none");
        }else{
            $(".colorCode").each(function() {
                if ($(this).hasClass("d-none")) {
                    $(this).removeClass("d-none");
                }
            });
        }
    });
    
    $(document).on("change", "#attrType", function(){
        resetAttributeValues();
        if($(this).val() == 'dropdown'){
            $(".colorCode").addClass("d-none");
        }else{
            $(".colorCode").each(function() {
                if ($(this).hasClass("d-none")) {
                    $(this).removeClass("d-none");
                }
            });
        }
    });
    
    function initializeMinicolors(){
        $('.demo').each(function() {
            $(this).minicolors({
                control: $(this).attr('data-control') || 'hue',
                defaultValue: $(this).attr('data-defaultValue') || '',
                format: $(this).attr('data-format') || 'hex',
                keywords: $(this).attr('data-keywords') || '',
                inline: $(this).attr('data-inline') === 'true',
                letterCase: $(this).attr('data-letterCase') || 'lowercase',
                opacity: $(this).attr('data-opacity'),
                position: $(this).attr('data-position') || 'bottom',
                swatches: $(this).attr('data-swatches') ? $(this).attr('data-swatches').split('|') : [],
                change: function(value, opacity) {
                    if (!value) return;
                    if (opacity) value += ', ' + opacity;
                    if (typeof console === 'object') {
                    }
                },
                theme: 'bootstrap'
            });
        });
    }

    $(document).on("click", ".delete-row", function (e) {
        e.preventDefault();
        $(this).tooltip('dispose');
        var idtodelete = $(this).attr("data-row-id");
        $("#rowid-" + idtodelete).remove();
    });

    function toSnakeCaseSlug(value) {
        return value
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/['’]/g, '')
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
            .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
            .replace(/[^a-zA-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .toLowerCase();
    }

    $(document).on('keyup', '#name', function() {
        $('#slug').val(toSnakeCaseSlug(this.value));

        if ($('#name').val().length >= 2) {
            attrbuteSuggestion();
        } else {
            removeSuggestion();
        }
    });

    $(document).on('input', '#slug', function() {
        this.value = toSnakeCaseSlug(this.value);
    });

    
    function attrbuteSuggestion()
    {
        /* Vendor create only: admin attribute forms have no #has_attribute; skip to avoid 404 on /admin/attributes/suggestion. */
        if (!$('#has_attribute').length) {
            return;
        }
        $.ajax({
            url: SITE_URL + '/attributes/suggestion',
            type: "GET",
            data: {
                parnet_id : $('#parentBlock').css('display') == 'none' ? null : $('#parent_id').val(),
                name : $('#name').val(),
            },
            dataType: "json",
            success:function(data) {
                if (typeof data.id != 'undefined') {
                    $('#has_attribute').removeClass('display_none');
                    let assignLink = `${data.name} ${jsLang('found!')} ${jsLang('Please')}<a href="javascript:void(0)" data-attribute_id = ${data.id} class="assigned_attribute" id="assigned_attribute">&nbsp;${jsLang('click here')}&nbsp;</a> ${jsLang('to assign')}`
                    $('#has_attribute').html(assignLink);

                    $('#has_attribute').on("click", function () {
                        assignAttribute();
                    });
                } else {
                    removeSuggestion();
                }
            }
        });
    }

    function removeSuggestion()
    {
        $('#has_attribute').empty();
        $('#has_attribute').addClass('display_none');
    }

    function assignAttribute()
    {
        let attribute_id = $('#assigned_attribute').data('attribute_id');

        swal({
            title: jsLang("Are you sure?"),
            icon: "warning",
            buttons: true,
            dangerMode: true,
        })
            .then((willDelete) => {
                if (willDelete) {
                    $.ajax({
                        type: "POST",
                        url: SITE_URL + '/attributes/assign-vendor',
                        data: {
                            "_token": token,
                            attribute_id: attribute_id,
                        },
                        success: function (data) {

                            if (data.status == 1) {
                                swal(jsLang('Assigned Successfully'), {
                                    icon: "success",
                                    buttons: [false, jsLang('Ok')],
                                }).then(function () {
                                    window.location.href = SITE_URL + '/all-attributes';
                                });
                                $('#has_attribute').addClass('display_none');
                                $('#has_attribute').empty();
                                resetForm();
                            } else {
                                swal(jsLang('Something went wrong, please try again.'), {
                                    icon: "error",
                                    buttons: [false, jsLang('Ok')],
                                });

                            }
                        }
                    });
                }
            });
    }

      /* reset from */
    function resetForm()
    {
        $('#status').val("Active").trigger('change');
        $('#name').empty();
        document.getElementById("brandAdd").reset();
    }
    
    


}
if ($(".main-body .page-wrapper").find("#attribute-list-container").length) {
    // For export csv
    $(document).on("click", "#csv, #pdf", function (event) {
        event.preventDefault();
        window.location = SITE_URL + "/attributes/" + this.id;
    });
}

if (
    $(".main-body .page-wrapper").find("#attribute_group-list-container").length
) {
    // For export csv
    $(document).on("click", "#csv, #pdf", function (event) {
        event.preventDefault();
        window.location = SITE_URL + "/attribute-groups/" + this.id;
    });
}

$(document).on('drag', '.edit-attribute', function() {
    $(this).tooltip('dispose');
})

$(document).on('mouseenter', '.edit-attribute', function() {
    $(this).tooltip('enable');
})
