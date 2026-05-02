import { useState } from 'react'

export default function ConsentModal({ onAccept, onDecline }) {
  const [checks, setChecks] = useState({ privacy: false, terms: false, data: false })

  const allChecked = Object.values(checks).every(Boolean)

  function toggle(key) {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box fade-in">
        <div className="modal-header">
          <h3>🛡️ Parental Consent, Privacy & Terms</h3>
          <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Required under the Botswana Data Protection Act 2018
          </p>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <h4>Privacy Policy</h4>
            <p>
              PSLE RevisionPro collects your child's name, grade level, and academic progress data
              solely for educational purposes. Data is stored securely on Supabase servers (Cape
              Town region) and is never sold or shared with third parties. You may request deletion
              of your child's data at any time by emailing <strong>privacy@revisionpro.co.bw</strong>.
            </p>
          </div>

          <div className="modal-section">
            <h4>Terms of Use</h4>
            <p>
              This platform is designed for Standard 6 and 7 students in Botswana. By registering,
              you confirm you are the parent or legal guardian of the student being enrolled.
              Subscriptions renew monthly and may be cancelled at any time. Content is aligned to
              the Botswana Primary School Leaving Examination (PSLE) curriculum.
            </p>
          </div>

          <div className="modal-section">
            <h4>Data Collection</h4>
            <p>
              We collect quiz scores, time spent studying, and subject progress to personalise
              your child's learning journey. No payment data is stored on our servers — all
              payments are processed securely by DPO Group.
            </p>
          </div>

          <div className="consent-checks">
            <label className="consent-check">
              <input type="checkbox" checked={checks.privacy} onChange={() => toggle('privacy')} />
              <span>I have read and agree to the <strong>Privacy Policy</strong> regarding my child's data.</span>
            </label>
            <label className="consent-check">
              <input type="checkbox" checked={checks.terms} onChange={() => toggle('terms')} />
              <span>I accept the <strong>Terms of Use</strong> and confirm I am the parent or legal guardian.</span>
            </label>
            <label className="consent-check">
              <input type="checkbox" checked={checks.data} onChange={() => toggle('data')} />
              <span>I <strong>consent to data collection</strong> as described above under the Botswana Data Protection Act 2018.</span>
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onDecline}>Decline</button>
          <button
            className="btn btn-primary"
            disabled={!allChecked}
            onClick={onAccept}
          >
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  )
}
