
import { Link } from 'react-router-dom'

function Home() {
  return (
    <>
      <div className='card'>
        <div className='card-h'>
          <strong>🌌 Welcome to Aurorae Haven</strong>
        </div>
        <div className='card-b'>
          <p>
            A calm, astro-themed productivity app designed for neurodivergent
            users. Manage your routines, tasks, habits, and notes with a focus
            on accessibility and peace of mind.
          </p>
          <p>
            <strong>Getting Started:</strong> Navigate using the menu above to
            explore different features. Your data is stored locally and can be
            exported/imported at any time.
          </p>
        </div>
      </div>

      <div className='card'>
        <div className='card-h'>
          <strong>✨ Features</strong>
        </div>
        <div className='card-b'>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <strong>
                <Link to='/schedule'>📅 Schedule</Link>
              </strong>
              <p style={{ margin: '4px 0 0 0', opacity: 0.8 }}>
                Plan your day with time blocks and visualize your schedule
              </p>
            </div>
            <div>
              <strong>
                <Link to='/routines'>⏱️ Routines</Link>
              </strong>
              <p style={{ margin: '4px 0 0 0', opacity: 0.8 }}>
                Create and run daily routines with step-by-step timers
              </p>
            </div>
            <div>
              <strong>
                <Link to='/braindump'>📝 Brain Dump</Link>
              </strong>
              <p style={{ margin: '4px 0 0 0', opacity: 0.8 }}>
                Quickly capture thoughts and ideas with tags
              </p>
            </div>
            <div>
              <strong>
                <Link to='/tasks'>✓ Tasks</Link>
              </strong>
              <p style={{ margin: '4px 0 0 0', opacity: 0.8 }}>
                Prioritize using the Eisenhower matrix (Coming Soon)
              </p>
            </div>
            <div>
              <strong>
                <Link to='/habits'>🌱 Habits</Link>
              </strong>
              <p style={{ margin: '4px 0 0 0', opacity: 0.8 }}>
                Track streaks and celebrate small wins (Coming Soon)
              </p>
            </div>
            <div>
              <strong>
                <Link to='/stats'>📊 Stats</Link>
              </strong>
              <p style={{ margin: '4px 0 0 0', opacity: 0.8 }}>
                View your progress and insights (Coming Soon)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='card'>
        <div className='card-h'>
          <strong>📱 Progressive Web App</strong>
        </div>
        <div className='card-b'>
          <p>
            Aurorae Haven is a Progressive Web App (PWA) that can be installed
            on your device for offline access and a native-like experience.
          </p>
          <p>
            <strong>To install:</strong>
          </p>
          <ul style={{ marginLeft: '20px', opacity: 0.9 }}>
            <li>
              <strong>Desktop:</strong> Look for the install icon in your
              browser&apos;s address bar, or use the browser menu to install
            </li>
            <li>
              <strong>Mobile:</strong> Tap the share button and select &quot;Add
              to Home Screen&quot;
            </li>
          </ul>
          <p style={{ marginTop: '12px', opacity: 0.8 }}>
            Once installed, you can use Aurorae Haven offline and access it like
            any other app on your device.
          </p>
        </div>
      </div>

      <div className='card'>
        <div className='card-h'>
          <strong>🔒 Privacy & Data</strong>
        </div>
        <div className='card-b'>
          <p>
            All your data stays on your device. We don&apos;t collect, transmit,
            or store any personal information. Use the Export/Import buttons in
            the header to back up your data anytime.
          </p>
        </div>
      </div>
    </>
  )
}

export default Home
