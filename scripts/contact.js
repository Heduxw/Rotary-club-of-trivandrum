const contactForm = document.getElementById("contact-form");

if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const subject = document.getElementById("subject").value.trim();
        const message = document.getElementById("message").value.trim();

        const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
        const mailtoLink = `mailto:info@rotaryclubtvm.org?subject=${encodeURIComponent(
            subject || "Website Contact Form"
        )}&body=${encodeURIComponent(body)}`;

        window.location.href = mailtoLink;

        const msg = document.getElementById("contact-form-msg");
        if (msg) {
            msg.textContent =
                "Opening your email client to send this message...";
        }
    });
}
