// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')

    const normalizeImageUrl = (field) => {
        if (!field || field.id !== 'imageUrl') return

        const rawValue = typeof field.value === 'string' ? field.value.trim() : field.value
        if (!rawValue) return

        if (/^https?:\/\//i.test(rawValue)) return

        const candidate = `https://${rawValue}`
        try {
            // eslint-disable-next-line no-new
            new URL(candidate)
            field.value = candidate
        } catch (error) {
            // Keep original value if it is not a valid URL candidate
        }
    }

    const validateField = (field, { onSubmit = false } = {}) => {
        if (!field || field.disabled || field.type === 'hidden') return

        normalizeImageUrl(field)

        const value = typeof field.value === 'string' ? field.value.trim() : field.value
        const hasValue = value !== ''

        if (!hasValue) {
            field.classList.remove('is-valid', 'is-invalid')
            return
        }

        if (field.id === 'title' && !onSubmit) {
            field.classList.remove('is-valid')
            return
        }

        if (field.checkValidity()) {
            field.classList.add('is-valid')
            field.classList.remove('is-invalid')
        } else {
            field.classList.add('is-invalid')
            field.classList.remove('is-valid')
        }
    }

    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
        const formFields = form.querySelectorAll('input, textarea, select')

        Array.from(formFields).forEach(field => {
            field.addEventListener('input', () => validateField(field))
            field.addEventListener('blur', () => validateField(field))
        })

        form.addEventListener('submit', event => {
            const imageField = form.querySelector('#imageUrl')
            normalizeImageUrl(imageField)

            if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
            }

            Array.from(formFields).forEach(field => validateField(field, { onSubmit: true }))

            form.classList.add('was-validated')
        }, false)
    })
})();

(() => {
    const navbar = document.getElementById('mainNavbar')
    const toggleBtn = document.getElementById('navbarThemeToggle')
    const pageBody = document.body
    const storageKey = 'wanderlust.navbarTheme'

    if (!navbar || !toggleBtn || !pageBody) return

    const setButtonLabel = (theme) => {
        if (theme === 'dark') {
            toggleBtn.innerHTML = '<i class="fa-regular fa-sun"></i>'
            toggleBtn.setAttribute('aria-pressed', 'true')
            return
        }

        toggleBtn.innerHTML = '<i class="fa-regular fa-moon"></i>'
        toggleBtn.setAttribute('aria-pressed', 'false')
    }

    const applyTheme = (theme) => {
        const nextTheme = theme === 'dark' ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', nextTheme)
        navbar.setAttribute('data-navbar-theme', nextTheme)
        pageBody.setAttribute('data-theme', nextTheme)
        setButtonLabel(nextTheme)
    }

    applyTheme(localStorage.getItem(storageKey) || 'light')

    toggleBtn.addEventListener('click', () => {
        const currentTheme = navbar.getAttribute('data-navbar-theme')
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
        applyTheme(nextTheme)
        localStorage.setItem(storageKey, nextTheme)
    })
})();