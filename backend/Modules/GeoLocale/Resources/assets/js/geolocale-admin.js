'use strict';

(function () {
    const createAlertHtml = function (message) {
        return `<div class="alert alert-warning mb-0">${message}</div>`;
    };

    const getConfig = function (browser) {
        return {
            countryListUrl: browser.dataset.countryListUrl || '',
            stateListUrl: browser.dataset.stateListUrl || '',
            cityListUrl: browser.dataset.cityListUrl || '',
            importUrl: browser.dataset.importUrl || '',
            titles: {
                countryLocations: browser.dataset.titleCountryLocations || 'Country Locations',
                stateLocations: browser.dataset.titleStateLocations || 'State Locations',
                cityLocations: browser.dataset.titleCityLocations || 'City Locations',
                importPage: browser.dataset.titleImportPage || 'Geo Locale Import',
                createCountry: browser.dataset.titleCreateCountry || 'Create Country',
                editCountry: browser.dataset.titleEditCountry || 'Edit Country',
                createState: browser.dataset.titleCreateState || 'Create State',
                editState: browser.dataset.titleEditState || 'Edit State',
                createCity: browser.dataset.titleCreateCity || 'Create City',
                editCity: browser.dataset.titleEditCity || 'Edit City',
            },
            messages: {
                checkForm: browser.dataset.msgCheckForm || 'Please check the form and try again.',
                fixFields: browser.dataset.msgFixFields || 'Please fix the highlighted fields and try again.',
                saving: browser.dataset.msgSaving || 'Saving...',
                saveCountryError: browser.dataset.msgSaveCountryError || 'Unable to save country right now.',
                saveCountrySuccess: browser.dataset.msgSaveCountrySuccess || 'Country has been saved successfully.',
                saveStateError: browser.dataset.msgSaveStateError || 'Unable to save state right now.',
                saveStateSuccess: browser.dataset.msgSaveStateSuccess || 'State has been successfully saved.',
                saveCityError: browser.dataset.msgSaveCityError || 'Unable to save city right now.',
                saveCitySuccess: browser.dataset.msgSaveCitySuccess || 'City has been successfully saved.',
                importError: browser.dataset.msgImportError || 'Unable to import GeoLocale data right now.',
                importSuccess: browser.dataset.msgImportSuccess || 'GeoLocale Data Imported Successfully.',
                loadError: browser.dataset.msgLoadError || 'Unable to load data right now.',
            },
            placeholders: {
                allCountries: browser.dataset.placeholderAllCountries || 'All Countries',
                allStates: browser.dataset.placeholderAllStates || 'All States',
                selectState: browser.dataset.placeholderSelectState || 'Select State',
            },
            toastLabels: {
                success: browser.dataset.toastSuccessLabel || 'Success',
                error: browser.dataset.toastErrorLabel || 'Error',
            },
        };
    };

    const initBrowser = function (browser) {
        if (!browser || browser.dataset.glBooted === 'true') {
            return;
        }

        browser.dataset.glBooted = 'true';

        const container = browser.closest('.mv-form-page') || browser.closest('.card') || browser.parentElement;

        if (!container) {
            return;
        }

        const config = getConfig(browser);
        const content = document.getElementById('geolocale-location-content');
        const panel = document.getElementById('geolocale-location-panel');
        const loader = document.getElementById('geolocale-location-loader');
        const pageTitle = document.getElementById('geolocale-page-title');
        const addCountryButton = document.getElementById('geolocale-add-country-btn');
        const addCountryWrap = document.getElementById('geolocale-add-country-wrap');
        const addStateButton = document.getElementById('geolocale-add-state-btn');
        const addStateWrap = document.getElementById('geolocale-add-state-wrap');
        const addCityWrap = document.getElementById('geolocale-add-city-wrap');
        const cache = new Map();
        let currentSection = browser.dataset.initialSection || 'country';
        let activeRequest = null;
        let shouldRestoreSearchFocus = false;
        let searchSelection = null;
        let searchDebounce = null;

        if (!content || !panel || !loader) {
            return;
        }

        const buildSectionCacheKey = function (section, url) {
            return `${section}::${new URL(url, window.location.origin).toString()}`;
        };

        const buildPageCacheKey = function (url) {
            return `page::${new URL(url, window.location.origin).toString()}`;
        };

        const withPartialQuery = function (url) {
            const requestUrl = new URL(url, window.location.origin);
            requestUrl.searchParams.set('partial', '1');
            return requestUrl.toString();
        };

        if (panel && currentSection) {
            cache.set(buildSectionCacheKey(currentSection, window.location.href), panel.innerHTML);
        }

        const resolvePageTitle = function (section, url) {
            if (typeof url === 'string') {
                if (url.includes('/country/create')) {
                    return config.titles.createCountry;
                }

                if (url.includes('/country/') && url.includes('/edit')) {
                    return config.titles.editCountry;
                }

                if (url.includes('/state/create')) {
                    return config.titles.createState;
                }

                if (url.includes('/state/') && url.includes('/edit')) {
                    return config.titles.editState;
                }

                if (url.includes('/city/create')) {
                    return config.titles.createCity;
                }

                if (url.includes('/city/') && url.includes('/edit')) {
                    return config.titles.editCity;
                }

                if (url.includes('/location/import')) {
                    return config.titles.importPage;
                }
            }

            if (section === 'state') {
                return config.titles.stateLocations;
            }

            if (section === 'city') {
                return config.titles.cityLocations;
            }

            if (section === 'import') {
                return config.titles.importPage;
            }

            return config.titles.countryLocations;
        };

        const syncPageTitle = function (section, url) {
            const title = resolvePageTitle(section, url);

            if (pageTitle) {
                pageTitle.textContent = title;
            }

            document.title = title;
        };

        const syncActionButtons = function (section, url) {
            const isCountryCreate = typeof url === 'string' && url.includes('/country/create');
            const isCountryEdit = typeof url === 'string' && url.includes('/country/') && url.includes('/edit');
            const isStateCreate = typeof url === 'string' && url.includes('/state/create');
            const isStateEdit = typeof url === 'string' && url.includes('/state/') && url.includes('/edit');
            const isCityCreate = typeof url === 'string' && url.includes('/city/create');
            const isCityEdit = typeof url === 'string' && url.includes('/city/') && url.includes('/edit');

            if (addCountryWrap) {
                addCountryWrap.classList.toggle('is-hidden', section !== 'country' || isCountryCreate || isCountryEdit);
            } else if (addCountryButton) {
                addCountryButton.style.display = section === 'country' && !isCountryCreate && !isCountryEdit ? '' : 'none';
            }

            if (addStateWrap) {
                addStateWrap.classList.toggle('is-hidden', section !== 'state' || isStateCreate || isStateEdit);
            } else if (addStateButton) {
                addStateButton.style.display = section === 'state' && !isStateCreate && !isStateEdit ? '' : 'none';
            }

            if (addCityWrap) {
                addCityWrap.classList.toggle('is-hidden', section !== 'city' || isCityCreate || isCityEdit);
            }
        };

        const getSectionListUrl = function (section) {
            if (section === 'state') {
                return config.stateListUrl;
            }

            if (section === 'city') {
                return config.cityListUrl;
            }

            if (section === 'import') {
                return config.importUrl;
            }

            return config.countryListUrl;
        };

        const syncLoaderPosition = function () {
            const rect = content.getBoundingClientRect();
            const visibleTop = Math.max(rect.top, 0);
            const visibleBottom = Math.min(rect.bottom, window.innerHeight);
            const visibleLeft = Math.max(rect.left, 0);
            const visibleRight = Math.min(rect.right, window.innerWidth);
            const visibleHeight = Math.max(visibleBottom - visibleTop, 0);
            const visibleWidth = Math.max(visibleRight - visibleLeft, 0);
            const centerY = visibleHeight > 0 ? visibleTop + (visibleHeight / 2) : rect.top + Math.min(rect.height / 2, 180);
            const centerX = visibleWidth > 0 ? visibleLeft + (visibleWidth / 2) : rect.left + (rect.width / 2);

            loader.style.setProperty('--gl-loader-x', `${centerX - rect.left}px`);
            loader.style.setProperty('--gl-loader-y', `${centerY - rect.top}px`);
        };

        const setLoading = function (mode = 'default') {
            syncLoaderPosition();
            content.classList.add('is-swapping');
            content.classList.toggle('is-searching', mode === 'search');
        };

        const clearLoading = function () {
            content.classList.remove('is-swapping');
            content.classList.remove('is-searching');
        };

        const renderLoadError = function () {
            clearLoading();
            panel.innerHTML = createAlertHtml(config.messages.loadError);
        };

        const setPanelHtml = function (html) {
            panel.innerHTML = html;
            clearLoading();
            initFormFields(panel);

            if (shouldRestoreSearchFocus) {
                const searchInput = panel.querySelector('form[data-location-search] input[name="search"]');

                if (searchInput) {
                    searchInput.focus({ preventScroll: true });

                    if (searchSelection && typeof searchInput.setSelectionRange === 'function') {
                        const maxLength = searchInput.value.length;
                        const start = Math.min(searchSelection.start, maxLength);
                        const end = Math.min(searchSelection.end, maxLength);
                        searchInput.setSelectionRange(start, end);
                    }
                }

                shouldRestoreSearchFocus = false;
                searchSelection = null;
            }
        };

        const fetchSection = async function (section, url, options = {}) {
            const cacheKey = buildSectionCacheKey(section, url);

            if (options.useCache !== false && cache.has(cacheKey)) {
                return cache.get(cacheKey);
            }

            const controller = options.controller || new AbortController();
            const response = await fetch(withPartialQuery(url), {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error('Failed to load section.');
            }

            const html = await response.text();
            cache.set(cacheKey, html);
            return html;
        };

        const fetchPage = async function (url, options = {}) {
            const cacheKey = buildPageCacheKey(url);

            if (options.useCache !== false && cache.has(cacheKey)) {
                return cache.get(cacheKey);
            }

            const controller = options.controller || new AbortController();
            const response = await fetch(withPartialQuery(url), {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error('Failed to load page.');
            }

            const html = await response.text();
            cache.set(cacheKey, html);
            return html;
        };

        const showToast = function (type, message) {
            if (!message) {
                return;
            }

            let toastStack = document.getElementById('gl-spa-toast-stack');

            if (!toastStack) {
                toastStack = document.createElement('div');
                toastStack.id = 'gl-spa-toast-stack';
                toastStack.style.position = 'fixed';
                toastStack.style.top = '68px';
                toastStack.style.right = '28px';
                toastStack.style.zIndex = '2100';
                toastStack.style.display = 'flex';
                toastStack.style.flexDirection = 'column';
                toastStack.style.alignItems = 'flex-end';
                toastStack.style.gap = '10px';
                toastStack.style.pointerEvents = 'none';
                document.body.appendChild(toastStack);
            }

            const toast = document.createElement('div');
            const isSuccess = type === 'success';
            const accentColor = isSuccess ? '#16a34a' : '#dc2626';
            const surfaceTone = isSuccess ? '#f0fdf4' : '#fef2f2';
            const borderTone = isSuccess ? '#bbf7d0' : '#fecaca';
            const icon = isSuccess
                ? '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M13.333 4.667 6.333 11.667 2.667 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                : '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 5.333v3.334m0 2h.007M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

            toast.style.minWidth = '300px';
            toast.style.maxWidth = '392px';
            toast.style.padding = '16px 18px 16px 16px';
            toast.style.borderRadius = '18px';
            toast.style.background = '#ffffff';
            toast.style.border = `1px solid ${borderTone}`;
            toast.style.color = '#111827';
            toast.style.boxShadow = '0 22px 60px rgba(15, 23, 42, 0.16)';
            toast.style.fontSize = '14px';
            toast.style.fontWeight = '500';
            toast.style.lineHeight = '1.5';
            toast.style.pointerEvents = 'auto';
            toast.style.position = 'relative';
            toast.style.overflow = 'hidden';
            toast.style.opacity = '0';
            toast.style.transform = 'translate3d(0, -14px, 0) scale(0.985)';
            toast.style.transition = 'opacity 220ms ease, transform 220ms ease';
            toast.style.backdropFilter = 'blur(10px)';
            toast.style.webkitBackdropFilter = 'blur(10px)';
            toast.innerHTML = `
                <div style="position:absolute; inset:0 0 auto 0; height:4px; background:${surfaceTone}; overflow:hidden;">
                    <span data-toast-progress style="display:block; height:100%; width:100%; background:${accentColor}; transform-origin:left center;"></span>
                </div>
                <div style="display:flex; align-items:flex-start; gap:12px;">
                    <div style="width:34px; height:34px; min-width:34px; border-radius:12px; background:${surfaceTone}; color:${accentColor}; display:flex; align-items:center; justify-content:center; margin-top:1px; box-shadow: inset 0 0 0 1px ${borderTone};">
                        ${icon}
                    </div>
                    <div style="flex:1; min-width:0; padding-right:6px;">
                        <div style="font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:${accentColor}; margin-bottom:4px;">
                            ${isSuccess ? config.toastLabels.success : config.toastLabels.error}
                        </div>
                        <div style="font-size:14px; font-weight:600; color:#111827; line-height:1.55; word-break:break-word;">
                            ${message}
                        </div>
                    </div>
                    <button type="button" aria-label="Close notification" data-toast-close style="appearance:none; border:0; background:transparent; color:#94a3b8; padding:0; width:20px; height:20px; min-width:20px; display:flex; align-items:center; justify-content:center; cursor:pointer; margin-top:2px;">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M10.5 3.5 3.5 10.5m0-7 7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
                    </button>
                </div>
            `;

            toastStack.appendChild(toast);

            const closeButton = toast.querySelector('[data-toast-close]');
            const progress = toast.querySelector('[data-toast-progress]');
            let cleanupTimer = null;
            let dismissTimer = null;
            let startedAt = null;
            let remainingTime = 5000;
            let isPaused = false;

            const dismissToast = function () {
                if (cleanupTimer) {
                    window.clearTimeout(cleanupTimer);
                }

                if (dismissTimer) {
                    window.clearTimeout(dismissTimer);
                }

                toast.style.opacity = '0';
                toast.style.transform = 'translate3d(0, -12px, 0) scale(0.985)';

                cleanupTimer = window.setTimeout(function () {
                    toast.remove();

                    if (!toastStack.childElementCount) {
                        toastStack.remove();
                    }
                }, 220);
            };

            const runProgress = function () {
                if (!progress) {
                    return;
                }

                progress.style.transition = 'none';
                progress.style.willChange = 'transform';
                progress.style.transform = `scaleX(${remainingTime / 5000})`;
                progress.getBoundingClientRect();

                window.requestAnimationFrame(function () {
                    window.requestAnimationFrame(function () {
                        progress.style.transition = `transform ${remainingTime}ms linear`;
                        progress.style.transform = 'scaleX(0)';
                    });
                });
            };

            const startDismissTimer = function () {
                startedAt = Date.now();
                dismissTimer = window.setTimeout(dismissToast, remainingTime);
                runProgress();
            };

            const pauseDismissTimer = function () {
                if (isPaused || !dismissTimer) {
                    return;
                }

                isPaused = true;
                remainingTime = Math.max(0, remainingTime - (Date.now() - startedAt));
                window.clearTimeout(dismissTimer);
                dismissTimer = null;

                if (progress) {
                    progress.style.transition = 'none';
                    progress.style.transform = `scaleX(${remainingTime / 5000})`;
                }
            };

            const resumeDismissTimer = function () {
                if (!isPaused || remainingTime <= 0) {
                    return;
                }

                isPaused = false;
                startDismissTimer();
            };

            if (closeButton) {
                closeButton.addEventListener('click', dismissToast);
            }

            toast.addEventListener('mouseenter', pauseDismissTimer);
            toast.addEventListener('mouseleave', resumeDismissTimer);

            window.requestAnimationFrame(function () {
                toast.style.opacity = '1';
                toast.style.transform = 'translate3d(0, 0, 0) scale(1)';
            });

            startDismissTimer();
        };

        const clearFormFeedback = function (form) {
            form.querySelectorAll('.gl-field-error').forEach(function (error) {
                error.remove();
            });

            form.querySelectorAll('.is-invalid').forEach(function (field) {
                field.classList.remove('is-invalid');
            });
        };

        const applyFormErrors = function (form, errors) {
            const entries = Object.entries(errors || {});

            if (!entries.length) {
                showToast('error', config.messages.checkForm);
                return;
            }

            showToast('error', config.messages.fixFields);

            entries.forEach(function ([fieldName, messages]) {
                const field = form.querySelector(`[name="${fieldName}"]`);

                if (!field) {
                    return;
                }

                field.classList.add('is-invalid');

                const holder = field.closest('.col-sm-12') || field.parentElement;
                const error = document.createElement('div');
                error.className = 'invalid-feedback d-block gl-field-error';
                error.textContent = Array.isArray(messages) ? messages[0] : messages;
                holder.appendChild(error);
            });
        };

        const setFormLoading = function (form, loading, activeSubmitter = null) {
            const submitButtons = Array.from(form.querySelectorAll('button[type="submit"]'));

            if (!submitButtons.length) {
                return;
            }

            submitButtons.forEach(function (submitButton) {
                if (!submitButton.dataset.defaultHtml) {
                    submitButton.dataset.defaultHtml = submitButton.innerHTML;
                }

                submitButton.disabled = loading;
                submitButton.classList.toggle('disabled-btn', loading);
                submitButton.setAttribute('aria-disabled', loading ? 'true' : 'false');
                submitButton.innerHTML = loading && submitButton === activeSubmitter
                    ? `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${config.messages.saving}`
                    : submitButton.dataset.defaultHtml;
            });
        };

        const updateCurrentPage = function (section, url, html) {
            currentSection = section;
            setPanelHtml(html);
            window.history.replaceState({}, '', url);
            syncActionButtons(currentSection, url);
            syncPageTitle(currentSection, url);
        };

        const submitResourceForm = async function (form, submitter, resource) {
            const resourceConfig = {
                country: {
                    listUrl: config.countryListUrl,
                    saveError: config.messages.saveCountryError,
                    saveSuccess: config.messages.saveCountrySuccess,
                },
                state: {
                    listUrl: config.stateListUrl,
                    saveError: config.messages.saveStateError,
                    saveSuccess: config.messages.saveStateSuccess,
                },
                city: {
                    listUrl: config.cityListUrl,
                    saveError: config.messages.saveCityError,
                    saveSuccess: config.messages.saveCitySuccess,
                },
            }[resource];

            if (!resourceConfig) {
                return;
            }

            clearFormFeedback(form);
            setFormLoading(form, true, submitter);

            try {
                const formData = new FormData(form);

                if (submitter && submitter.name) {
                    formData.set(submitter.name, submitter.value || submitter.dataset.submitMode || '');
                }

                const response = await fetch(form.getAttribute('action'), {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                    },
                    body: formData,
                });

                if (response.status === 422) {
                    const data = await response.json();
                    applyFormErrors(form, data.errors || {});
                    return;
                }

                const data = await response.json();

                if (!response.ok || data.status !== 'success') {
                    showToast('error', data.message || resourceConfig.saveError);
                    return;
                }

                const targetUrl = data.redirect_url || resourceConfig.listUrl;
                const isPageTarget = targetUrl.includes('/create') || targetUrl.includes('/edit');

                setLoading();

                if (activeRequest) {
                    activeRequest.abort();
                }

                activeRequest = new AbortController();

                Array.from(cache.keys()).forEach(function (key) {
                    if (key.startsWith(`${resource}::`) || key === buildPageCacheKey(targetUrl)) {
                        cache.delete(key);
                    }
                });

                const successMessage = data.message || resourceConfig.saveSuccess;

                if (isPageTarget) {
                    const html = await fetchPage(targetUrl, {
                        controller: activeRequest,
                        useCache: false,
                    });

                    updateCurrentPage(resource, targetUrl, html);
                } else {
                    const html = await fetchSection(resource, targetUrl, {
                        controller: activeRequest,
                        useCache: false,
                    });

                    activateSection(resource, targetUrl, html);
                }

                showToast('success', successMessage);
            } catch (error) {
                showToast('error', resourceConfig.saveError);
            } finally {
                setFormLoading(form, false);
            }
        };

        const syncImportFormState = function (scope) {
            const importForm = (scope || panel).querySelector('form[data-location-import-form]');

            if (!importForm) {
                return;
            }

            const confirmInput = importForm.querySelector('[data-import-confirm]');
            const submitButton = importForm.querySelector('[data-import-submit]');

            if (!confirmInput || !submitButton) {
                return;
            }

            submitButton.disabled = confirmInput.value.trim() !== 'import';
        };

        const submitImportForm = async function (form, submitter = null) {
            clearFormFeedback(form);
            setFormLoading(form, true, submitter);

            try {
                const response = await fetch(form.getAttribute('action'), {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                    },
                    body: new FormData(form),
                });

                const data = await response.json();

                if (!response.ok || data.status !== 'success') {
                    showToast('error', data.message || config.messages.importError);
                    return;
                }

                const targetUrl = data.redirect_url || config.countryListUrl;
                setLoading();

                if (activeRequest) {
                    activeRequest.abort();
                }

                activeRequest = new AbortController();

                Array.from(cache.keys()).forEach(function (key) {
                    if (key.startsWith('country::') || key.startsWith('state::') || key.startsWith('city::') || key.startsWith('import::')) {
                        cache.delete(key);
                    }
                });

                const html = await fetchSection('country', targetUrl, {
                    controller: activeRequest,
                    useCache: false,
                });

                activateSection('country', targetUrl, html);
                showToast('success', data.message || config.messages.importSuccess);
            } catch (error) {
                showToast('error', config.messages.importError);
            } finally {
                setFormLoading(form, false);
                syncImportFormState(form.parentElement || panel);
            }
        };

        const submitSearchForm = async function (searchForm, section, options = {}) {
            const url = new URL(searchForm.getAttribute('action'), window.location.origin);
            const formData = new FormData(searchForm);
            const searchValue = (formData.get('search') || '').toString().trim();

            if (searchValue !== '') {
                url.searchParams.set('search', searchValue);
            } else {
                url.searchParams.delete('search');
            }

            if (section === 'state' || section === 'city') {
                const countryId = (formData.get('country_id') || '').toString().trim();

                if (countryId !== '') {
                    url.searchParams.set('country_id', countryId);
                } else {
                    url.searchParams.delete('country_id');
                }
            }

            if (section === 'city') {
                const divisionId = (formData.get('division_id') || '').toString().trim();

                if (divisionId !== '') {
                    url.searchParams.set('division_id', divisionId);
                } else {
                    url.searchParams.delete('division_id');
                }
            }

            setLoading(options.mode === 'search' ? 'search' : 'default');

            if (activeRequest) {
                activeRequest.abort();
            }

            activeRequest = new AbortController();

            try {
                const html = await fetchSection(section, url.toString(), {
                    controller: activeRequest,
                    useCache: false,
                });

                activateSection(section, url.toString(), html);
            } catch (error) {
                if (error.name === 'AbortError') {
                    return;
                }

                renderLoadError();
            }
        };

        const initFormFields = function (root) {
            const scope = root instanceof Element ? root : document;
            const stateCountrySelect = scope.querySelector('[data-state-country-select]');
            const stateHasCitySelect = scope.querySelector('#state_has_city');
            const stateCountryFilter = scope.querySelector('[data-state-country-filter]');
            const cityCountryFilter = scope.querySelector('[data-city-country-filter]');
            const cityStateFilter = scope.querySelector('[data-city-state-filter]');
            const countrySelect = scope.querySelector('[data-city-country-select]');
            const stateSelect = scope.querySelector('[data-city-state-select]');
            const closeSelect2Instance = function (instance, element) {
                if (!instance || typeof instance.select2 !== 'function') {
                    return;
                }

                try {
                    instance.select2('close');
                } catch (error) {
                    // Ignore Select2 close errors during rapid re-render cycles.
                }

                if (element && typeof element.blur === 'function') {
                    element.blur();
                }
            };
            const bindSelect2ClearBehavior = function (instance, element, namespace) {
                if (!instance || !element) {
                    return;
                }

                const clearFlagKey = `glSelect2ClearPending${namespace}`;

                instance
                    .off(`select2:unselecting.${namespace}`)
                    .on(`select2:unselecting.${namespace}`, function () {
                        element.dataset[clearFlagKey] = 'true';
                    });

                instance
                    .off(`select2:clearing.${namespace}`)
                    .on(`select2:clearing.${namespace}`, function () {
                        element.dataset[clearFlagKey] = 'true';
                    });

                instance
                    .off(`select2:opening.${namespace}`)
                    .on(`select2:opening.${namespace}`, function (event) {
                        if (element.dataset[clearFlagKey] === 'true') {
                            element.dataset[clearFlagKey] = 'false';
                            event.preventDefault();
                        }
                    });

                instance
                    .off(`select2:clear.${namespace} select2:unselect.${namespace}`)
                    .on(`select2:clear.${namespace} select2:unselect.${namespace}`, function () {
                        window.setTimeout(function () {
                            element.dataset[clearFlagKey] = 'false';
                            closeSelect2Instance(instance, element);
                        }, 0);
                    });

                instance
                    .off(`select2:close.${namespace}`)
                    .on(`select2:close.${namespace}`, function () {
                        element.dataset[clearFlagKey] = 'false';
                    });
            };

            if (stateCountrySelect && typeof window.jQuery !== 'undefined' && typeof window.jQuery.fn.select2 === 'function') {
                window.jQuery(stateCountrySelect).select2({ width: '100%' });
            }

            if (stateHasCitySelect && typeof window.jQuery !== 'undefined' && typeof window.jQuery.fn.select2 === 'function') {
                const hasCityInstance = window.jQuery(stateHasCitySelect);

                if (hasCityInstance.hasClass('select2-hidden-accessible')) {
                    hasCityInstance.select2('destroy');
                }

                hasCityInstance.select2({
                    width: '100%',
                    minimumResultsForSearch: Infinity,
                });
            }

            if (stateCountryFilter && typeof window.jQuery !== 'undefined' && typeof window.jQuery.fn.select2 === 'function') {
                const filterInstance = window.jQuery(stateCountryFilter);

                if (filterInstance.hasClass('select2-hidden-accessible')) {
                    filterInstance.select2('destroy');
                }

                filterInstance.select2({
                    width: '100%',
                    placeholder: stateCountryFilter.getAttribute('data-placeholder') || config.placeholders.allCountries,
                    allowClear: true,
                });
                bindSelect2ClearBehavior(filterInstance, stateCountryFilter, 'geolocaleStateFilterClear');

                filterInstance.off('change.geolocaleStateFilter').on('change.geolocaleStateFilter', function () {
                    closeSelect2Instance(filterInstance, stateCountryFilter);
                    const searchForm = stateCountryFilter.form;

                    if (searchForm && searchForm.getAttribute('data-location-search') === 'state') {
                        submitSearchForm(searchForm, 'state');
                    }
                });
            }

            if (cityCountryFilter && cityStateFilter && typeof window.jQuery !== 'undefined' && typeof window.jQuery.fn.select2 === 'function') {
                const cityCountryInstance = window.jQuery(cityCountryFilter);
                const cityStateInstance = window.jQuery(cityStateFilter);

                if (cityCountryInstance.hasClass('select2-hidden-accessible')) {
                    cityCountryInstance.select2('destroy');
                }

                if (cityStateInstance.hasClass('select2-hidden-accessible')) {
                    cityStateInstance.select2('destroy');
                }

                cityCountryInstance.select2({
                    width: '100%',
                    placeholder: cityCountryFilter.getAttribute('data-placeholder') || config.placeholders.allCountries,
                    allowClear: true,
                });
                bindSelect2ClearBehavior(cityCountryInstance, cityCountryFilter, 'geolocaleCityCountryFilterClear');

                if (!cityStateFilter.dataset.originalOptions) {
                    cityStateFilter.dataset.originalOptions = cityStateFilter.innerHTML;
                }

                const rebuildCityStateSelect2 = function () {
                    if (cityStateInstance.hasClass('select2-hidden-accessible')) {
                        cityStateInstance.select2('destroy');
                    }

                    cityStateInstance.select2({
                        width: '100%',
                        placeholder: cityStateFilter.getAttribute('data-placeholder') || config.placeholders.allStates,
                        allowClear: true,
                    });
                    bindSelect2ClearBehavior(cityStateInstance, cityStateFilter, 'geolocaleCityStateFilterClear');
                };

                const restoreCityStateFilterOptions = function (selectedValue = '') {
                    cityStateFilter.innerHTML = cityStateFilter.dataset.originalOptions || '';

                    if (selectedValue) {
                        cityStateFilter.value = selectedValue;
                    }

                    rebuildCityStateSelect2();
                };

                const fillCityStateFilterOptions = function (states, selectedValue = '') {
                    const fragment = document.createDocumentFragment();
                    const placeholderOption = document.createElement('option');
                    placeholderOption.value = '';
                    placeholderOption.textContent = cityStateFilter.getAttribute('data-placeholder') || config.placeholders.allStates;
                    fragment.appendChild(placeholderOption);

                    states.forEach(function (state) {
                        const option = document.createElement('option');
                        option.value = String(state.id);
                        option.textContent = state.name;
                        option.dataset.countryId = String(state.country_id ?? cityCountryFilter.value ?? '');

                        if (selectedValue && String(selectedValue) === String(state.id)) {
                            option.selected = true;
                        }

                        fragment.appendChild(option);
                    });

                    cityStateFilter.innerHTML = '';
                    cityStateFilter.appendChild(fragment);
                    rebuildCityStateSelect2();
                };

                const loadCityStateFilterOptions = async function (selectedValue = '') {
                    const selectedCountry = cityCountryFilter.value;
                    const endpointTemplate = cityCountryFilter.getAttribute('data-city-filter-state-endpoint-template');

                    if (!selectedCountry || !endpointTemplate) {
                        restoreCityStateFilterOptions(selectedValue);
                        return;
                    }

                    try {
                        const response = await fetch(endpointTemplate.replace('__COUNTRY__', encodeURIComponent(selectedCountry)), {
                            headers: {
                                'X-Requested-With': 'XMLHttpRequest',
                                'Accept': 'application/json',
                            },
                        });

                        if (!response.ok) {
                            throw new Error('Failed to fetch states.');
                        }

                        const payload = await response.json();
                        fillCityStateFilterOptions(Array.isArray(payload.data) ? payload.data : [], selectedValue);
                    } catch (error) {
                        restoreCityStateFilterOptions(selectedValue);
                    }
                };

                loadCityStateFilterOptions(cityStateFilter.value);

                cityCountryInstance.off('change.geolocaleCityCountryFilter').on('change.geolocaleCityCountryFilter', async function () {
                    closeSelect2Instance(cityCountryInstance, cityCountryFilter);
                    closeSelect2Instance(cityStateInstance, cityStateFilter);
                    await loadCityStateFilterOptions('');

                    const searchForm = cityCountryFilter.form;

                    if (searchForm && searchForm.getAttribute('data-location-search') === 'city') {
                        submitSearchForm(searchForm, 'city');
                    }
                });

                cityStateInstance.off('change.geolocaleCityStateFilter').on('change.geolocaleCityStateFilter', function () {
                    closeSelect2Instance(cityStateInstance, cityStateFilter);
                    const searchForm = cityStateFilter.form;

                    if (searchForm && searchForm.getAttribute('data-location-search') === 'city') {
                        submitSearchForm(searchForm, 'city');
                    }
                });
            }

            if (!countrySelect || !stateSelect) {
                syncImportFormState(scope);
                return;
            }

            const initSelect2 = function (element) {
                if (typeof window.jQuery === 'undefined' || typeof window.jQuery.fn.select2 !== 'function') {
                    return;
                }

                const instance = window.jQuery(element);

                if (instance.hasClass('select2-hidden-accessible')) {
                    instance.select2('destroy');
                }

                instance.select2({ width: '100%' });
            };

            const syncStateOptions = function () {
                const selectedCountry = countrySelect.value;

                Array.from(stateSelect.options).forEach(function (option, index) {
                    if (index === 0) {
                        option.hidden = false;
                        return;
                    }

                    const matches = !selectedCountry || option.getAttribute('data-country-id') === selectedCountry;
                    option.hidden = !matches;

                    if (!matches && option.selected) {
                        stateSelect.value = '';
                    }
                });
            };

            const setStateOptions = function (states, selectedValue = '') {
                const fragment = document.createDocumentFragment();
                const placeholderOption = document.createElement('option');
                placeholderOption.value = '';
                placeholderOption.textContent = config.placeholders.selectState;
                fragment.appendChild(placeholderOption);

                states.forEach(function (state) {
                    const option = document.createElement('option');
                    option.value = state.id;
                    option.textContent = state.name;
                    option.dataset.countryId = state.country_id ?? countrySelect.value;

                    if (String(selectedValue) === String(state.id)) {
                        option.selected = true;
                    }

                    fragment.appendChild(option);
                });

                stateSelect.innerHTML = '';
                stateSelect.appendChild(fragment);
                initSelect2(stateSelect);
            };

            const loadCountryStates = async function (selectedValue = '') {
                const countryId = countrySelect.value;
                const endpointTemplate = countrySelect.getAttribute('data-city-state-endpoint-template');

                if (!countryId || !endpointTemplate) {
                    syncStateOptions();
                    initSelect2(stateSelect);
                    return;
                }

                try {
                    const response = await fetch(endpointTemplate.replace('__COUNTRY__', encodeURIComponent(countryId)), {
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    });

                    if (!response.ok) {
                        throw new Error('Failed to load states.');
                    }

                    const payload = await response.json();
                    setStateOptions(Array.isArray(payload.data) ? payload.data : [], selectedValue);
                } catch (error) {
                    syncStateOptions();
                    initSelect2(stateSelect);
                }
            };

            initSelect2(countrySelect);
            initSelect2(stateSelect);

            if (!countrySelect.dataset.cityStateLoaderBound) {
                countrySelect.addEventListener('change', function () {
                    loadCountryStates('');
                });

                if (typeof window.jQuery !== 'undefined') {
                    window.jQuery(countrySelect).off('change.geolocaleCityStates').on('change.geolocaleCityStates', function () {
                        loadCountryStates('');
                    });
                }

                countrySelect.dataset.cityStateLoaderBound = 'true';
            }

            loadCountryStates(stateSelect.value);
            syncImportFormState(scope);
        };

        const activateSection = function (section, url, html) {
            const links = container.querySelectorAll('[data-location-section]');

            links.forEach(function (link) {
                const isActive = link.getAttribute('data-location-section') === section;
                link.classList.toggle('active', isActive);
                link.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });

            syncActionButtons(section, url);
            syncPageTitle(section, url);

            if (typeof html === 'string') {
                setPanelHtml(html);
            }

            if (url) {
                window.history.replaceState({}, '', url);
            }

            currentSection = section;
        };

        const hideDeleteModal = function () {
            const modalElement = document.getElementById('confirmDelete');

            if (!modalElement || typeof bootstrap === 'undefined' || !bootstrap.Modal) {
                document.body.classList.remove('admin-delete-modal-open');
                return Promise.resolve();
            }

            const instance = bootstrap.Modal.getInstance(modalElement);

            if (!instance) {
                document.body.classList.remove('admin-delete-modal-open');
                return Promise.resolve();
            }

            return new Promise(function (resolve) {
                const onHidden = function () {
                    modalElement.removeEventListener('hidden.bs.modal', onHidden);
                    document.body.classList.remove('admin-delete-modal-open');
                    window.setTimeout(resolve, 60);
                };

                modalElement.addEventListener('hidden.bs.modal', onHidden, { once: true });
                instance.hide();
            });
        };

        const handleDeleteFormSubmit = async function (form) {
            setLoading();

            if (activeRequest) {
                activeRequest.abort();
            }

            activeRequest = new AbortController();

            try {
                const response = await fetch(form.getAttribute('action'), {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                    },
                    body: new FormData(form),
                    signal: activeRequest.signal,
                });

                const data = await response.json();

                if (!response.ok || !data || data.status !== 'success') {
                    throw new Error('Failed to delete record.');
                }

                await hideDeleteModal();

                Array.from(cache.keys()).forEach(function (key) {
                    if (key.startsWith(`${currentSection}::`)) {
                        cache.delete(key);
                    }
                });

                const refreshUrl = getSectionListUrl(currentSection);
                const html = await fetchSection(currentSection, refreshUrl, {
                    controller: activeRequest,
                    useCache: false,
                });

                activateSection(currentSection, refreshUrl, html);
                showToast('success', data.message || 'Record has been successfully deleted.');
            } catch (error) {
                if (error.name === 'AbortError') {
                    return;
                }

                await hideDeleteModal();
                renderLoadError();
            }
        };

        document.addEventListener('submit', async function (event) {
            const form = event.target;

            if (!form || !form.id || !form.id.startsWith('delete-data-') || !container.contains(form)) {
                return;
            }

            event.preventDefault();
            await handleDeleteFormSubmit(form);
        }, true);

        if (typeof window.jQuery !== 'undefined') {
            window.jQuery(document)
                .off('submit.geolocaleDelete')
                .on('submit.geolocaleDelete', 'form[id^="delete-data-"]', function (event) {
                    if (!container.contains(this)) {
                        return true;
                    }

                    event.preventDefault();
                    handleDeleteFormSubmit(this);
                    return false;
                });
        }

        container.addEventListener('click', async function (event) {
            const sectionLink = event.target.closest('[data-location-section]');
            const pageLink = event.target.closest('[data-location-page]');

            if (sectionLink) {
                event.preventDefault();

                const section = sectionLink.getAttribute('data-location-section');
                const url = sectionLink.getAttribute('href');
                const cacheKey = buildSectionCacheKey(section, url);

                if (section === currentSection && cache.has(cacheKey)) {
                    activateSection(section, url, cache.get(cacheKey));
                    return;
                }

                activateSection(section);

                if (cache.has(cacheKey)) {
                    activateSection(section, url, cache.get(cacheKey));
                    return;
                }

                setLoading();

                if (activeRequest) {
                    activeRequest.abort();
                }

                activeRequest = new AbortController();

                try {
                    const html = await fetchSection(section, url, {
                        controller: activeRequest,
                    });

                    activateSection(section, url, html);
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        renderLoadError();
                    }
                }

                return;
            }

            const paginationLink = event.target.closest('#geolocale-location-panel .dataTables_paginate a, #geolocale-location-panel .pagination a');

            if (paginationLink) {
                event.preventDefault();

                const url = paginationLink.getAttribute('href');

                if (!url) {
                    return;
                }

                setLoading();

                if (activeRequest) {
                    activeRequest.abort();
                }

                activeRequest = new AbortController();

                try {
                    const html = await fetchSection(currentSection, url, {
                        controller: activeRequest,
                    });

                    activateSection(currentSection, url, html);
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        renderLoadError();
                    }
                }

                return;
            }

            if (!pageLink) {
                return;
            }

            event.preventDefault();

            const url = pageLink.getAttribute('href');
            setLoading();

            if (activeRequest) {
                activeRequest.abort();
            }

            activeRequest = new AbortController();

            try {
                const html = await fetchPage(url, {
                    controller: activeRequest,
                    useCache: false,
                });

                updateCurrentPage(currentSection, url, html);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    renderLoadError();
                }
            }
        });

        container.addEventListener('submit', async function (event) {
            const searchForm = event.target.closest('form[data-location-search]');

            if (!searchForm) {
                return;
            }

            event.preventDefault();
            const searchInput = searchForm.querySelector('input[name="search"]');
            shouldRestoreSearchFocus = true;
            searchSelection = searchInput ? {
                start: searchInput.selectionStart ?? searchInput.value.length,
                end: searchInput.selectionEnd ?? searchInput.value.length,
            } : null;

            const searchType = searchForm.getAttribute('data-location-search') || 'country';
            await submitSearchForm(searchForm, searchType, {
                mode: searchType === 'country' ? 'search' : 'default',
            });
        });

        container.addEventListener('submit', async function (event) {
            const countryForm = event.target.closest('form[data-location-country-form]');
            const stateForm = event.target.closest('form[data-location-state-form]');
            const cityForm = event.target.closest('form[data-location-city-form]');

            if (countryForm) {
                event.preventDefault();
                await submitResourceForm(countryForm, event.submitter || null, 'country');
                return;
            }

            if (stateForm) {
                event.preventDefault();
                await submitResourceForm(stateForm, event.submitter || null, 'state');
                return;
            }

            if (cityForm) {
                event.preventDefault();
                await submitResourceForm(cityForm, event.submitter || null, 'city');
                return;
            }

            const importForm = event.target.closest('form[data-location-import-form]');

            if (!importForm) {
                return;
            }

            event.preventDefault();
            await submitImportForm(importForm, event.submitter || null);
        });

        container.addEventListener('input', function (event) {
            if (event.target.matches('[data-import-confirm]')) {
                syncImportFormState(event.target.closest('form'));
                return;
            }

            const searchInput = event.target.closest('form[data-location-search] input[name="search"]');

            if (!searchInput) {
                return;
            }

            const searchForm = searchInput.form;
            shouldRestoreSearchFocus = true;
            searchSelection = {
                start: searchInput.selectionStart ?? searchInput.value.length,
                end: searchInput.selectionEnd ?? searchInput.value.length,
            };

            window.clearTimeout(searchDebounce);
            searchDebounce = window.setTimeout(function () {
                const searchType = searchForm.getAttribute('data-location-search') || 'country';
                submitSearchForm(searchForm, searchType, {
                    mode: searchType === 'country' ? 'search' : 'default',
                });
            }, 500);
        });

        container.addEventListener('change', function (event) {
            const filterSelect = event.target.closest('form[data-location-search] select[name="country_id"]');

            if (!filterSelect) {
                return;
            }

            const searchForm = filterSelect.form;

            if (searchForm && searchForm.getAttribute('data-location-search') === 'state') {
                submitSearchForm(searchForm, 'state');
            }
        });

        window.addEventListener('resize', function () {
            if (content.classList.contains('is-swapping')) {
                syncLoaderPosition();
            }
        });

        window.addEventListener('scroll', function () {
            if (content.classList.contains('is-swapping')) {
                syncLoaderPosition();
            }
        }, { passive: true });

        syncLoaderPosition();
        activateSection(currentSection);
        initFormFields(panel);
        syncActionButtons(currentSection, window.location.href);
        syncPageTitle(currentSection, window.location.href);
    };

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('#geolocale-location-browser').forEach(initBrowser);
    });
})();
