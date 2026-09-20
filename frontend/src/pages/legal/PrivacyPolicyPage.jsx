const PrivacyPolicyPage = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-slate-200">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Privacy Policy</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Privacy and data handling</h1>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-300">
          <p>
            This platform is designed to support agricultural operations with operational data, crop planning information,
            soil and irrigation records, marketplace activity, and compliance documentation. We process data only for the
            functions described in the product and to provide the services available through this application.
          </p>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">Information we collect</h2>
            <p>
              We may collect account information, farm profile details, field and crop records, sensor or monitoring data,
              uploaded documents, and communication records required to operate the platform. We also retain activity data
              necessary to maintain security, service quality, and operational continuity.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">How we use information</h2>
            <p>
              Data is used to provide dashboard insights, planning recommendations, irrigation and soil monitoring, market
              and finance features, compliance services, and system security. We do not sell personal data or farm data to
              third parties for unrelated marketing.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">Security</h2>
            <p>
              We apply reasonable administrative, technical, and organizational safeguards designed to protect user data.
              However, no digital service can guarantee absolute security, and users should keep credentials confidential.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">Cookies and analytics</h2>
            <p>
              We may use minimal cookies or session storage to support login state, application preferences, and service
              functionality. Analytics, if enabled, will be configured to measure product performance and usage trends only.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">Your rights</h2>
            <p>
              Depending on applicable law, users may have rights to access, correct, delete, or restrict processing of
              personal data and to raise concerns with local data protection authorities. Requests can be directed to the
              platform administrator or designated support contact associated with the deployment.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">Changes to this policy</h2>
            <p>
              This policy may be updated when product features, legal requirements, or operational practices change. The
              most recent version remains effective on the platform website or deployment environment.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;

