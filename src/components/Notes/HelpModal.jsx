import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import '../../assets/styles/help-modal.css'

/**
 * Help Modal Component for Brain Dump
 * Displays formatting help for markdown, LaTeX, and images
 */
function HelpModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('quick')
  const modalRef = useRef(null)
  const closeButtonRef = useRef(null)

  // Focus management: focus close button on mount
  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Focus trap
  useEffect(() => {
    const handleFocusTrap = (e) => {
      if (!modalRef.current) return

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      // Guard clause: prevent errors if no focusable elements
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleFocusTrap)
    return () => document.removeEventListener('keydown', handleFocusTrap)
  }, [])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const renderQuickReference = () => (
    <div className='help-content'>
      <h3>Common Markdown</h3>
      <div className='help-section'>
        <code>**bold**</code> <code>_italic_</code> <code>`code`</code>{' '}
        <code>[link](url)</code>
      </div>

      <h3>LaTeX Equations</h3>
      <div className='help-section'>
        <p>
          <strong>Inline:</strong> <code>$E = mc^2$</code> → E = mc²
        </p>
        <p>
          <strong>Display:</strong>
        </p>
        <pre>
          <code>
            {`$$
x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}
$$`}
          </code>
        </pre>
      </div>

      <h3>Images</h3>
      <div className='help-section'>
        <code>![alt text](image-url)</code>
        <p>Click 📎 Attach button to upload files</p>
      </div>

      <div className='help-section'>
        <a
          href='https://github.com/aurorae-haven/aurorae-haven/blob/main/USER_MANUAL.md'
          target='_blank'
          rel='noopener noreferrer'
          className='btn help-btn-primary'
        >
          📖 View Full Manual
        </a>
      </div>
    </div>
  )

  const renderLatexExamples = () => (
    <div className='help-content'>
      <h3>Inline Math</h3>
      <div className='help-section'>
        <p>Use single dollar signs for inline equations:</p>
        <table className='help-table'>
          <thead>
            <tr>
              <th>Syntax</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>$E = mc^2$</code>
              </td>
              <td>
                <em>E = mc²</em>
              </td>
            </tr>
            <tr>
              <td>
                <code>$\alpha, \beta, \gamma$</code>
              </td>
              <td>
                <em>α, β, γ</em>
              </td>
            </tr>
            <tr>
              <td>
                <code>$\frac&#123;a&#125;&#123;b&#125;$</code>
              </td>
              <td>
                <em>a/b (fraction)</em>
              </td>
            </tr>
            <tr>
              <td>
                <code>$\sqrt&#123;x&#125;$</code>
              </td>
              <td>
                <em>√x</em>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Display Math</h3>
      <div className='help-section'>
        <p>Use double dollar signs on separate lines:</p>
        <pre>
          <code>
            {`$$
\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)
$$`}
          </code>
        </pre>
      </div>

      <h3>Common Symbols</h3>
      <div className='help-section'>
        <ul className='help-list'>
          <li>
            Greek: <code>$\alpha$, $\beta$, $\gamma$, $\Delta$, $\Sigma$</code>
          </li>
          <li>
            Operators:{' '}
            <code>{'$\\sum$, $\\prod$, $\\int$, $\\lim$, $\\frac{a}{b}$'}</code>
          </li>
          <li>
            Relations:{' '}
            <code>{'$\\leq$, $\\geq$, $\\neq$, $\\approx$, $\\in$'}</code>
          </li>
          <li>
            Arrows: <code>{'$\\to$, $\\leftarrow$, $\\Rightarrow$'}</code>
          </li>
        </ul>
      </div>

      <div className='help-section'>
        <a
          href='https://katex.org/docs/supported.html'
          target='_blank'
          rel='noopener noreferrer'
          className='btn help-btn-secondary'
        >
          KaTeX Documentation
        </a>
      </div>
    </div>
  )

  const renderImagesHelp = () => (
    <div className='help-content'>
      <h3>Basic Syntax</h3>
      <div className='help-section'>
        <pre>
          <code>![Alt text description](image-url-or-path)</code>
        </pre>
        <p>
          <strong>Alt text</strong> is required for accessibility and describes
          the image content.
        </p>
      </div>

      <h3>Using File Attachments (OPFS)</h3>
      <div className='help-section'>
        <ol className='help-list'>
          <li>Click the 📎 Attach button in the toolbar</li>
          <li>Select your image file</li>
          <li>
            Reference is automatically inserted:
            <pre>
              <code>📎 Attachment: image.png (125.4 KB)</code>
            </pre>
          </li>
        </ol>
        <p>
          <strong>Supported browsers:</strong> Chrome 86+, Edge 86+, Opera 72+
        </p>
      </div>

      <h3>External Images</h3>
      <div className='help-section'>
        <pre>
          <code>
            ![Mountain landscape](https://example.com/images/mountain.jpg)
          </code>
        </pre>
        <p>
          <strong>Note:</strong> External images must be from trusted sources
          due to Content Security Policy.
        </p>
      </div>

      <h3>Best Practices</h3>
      <div className='help-section'>
        <ul className='help-list'>
          <li>✓ Always include descriptive alt text</li>
          <li>✓ Use local file attachments for privacy</li>
          <li>✓ Optimize image sizes (compress before uploading)</li>
          <li>✓ Prefer .jpg for photos, .png for screenshots</li>
        </ul>
      </div>
    </div>
  )

  const renderFullManual = () => (
    <div className='help-content'>
      <h3>Complete Documentation</h3>
      <div className='help-section'>
        <p>
          For comprehensive documentation on all features, including advanced
          LaTeX examples, image optimization, and accessibility guidelines,
          visit the full user manual.
        </p>

        <div style={{ marginTop: '1.5rem' }}>
          <a
            href='https://github.com/aurorae-haven/aurorae-haven/blob/main/USER_MANUAL.md'
            target='_blank'
            rel='noopener noreferrer'
            className='btn help-btn-primary'
            style={{ display: 'inline-block', marginRight: '1rem' }}
          >
            📖 User Manual
          </a>
          <a
            href='https://github.com/aurorae-haven/aurorae-haven/blob/main/docs/BRAIN_DUMP_USAGE.md'
            target='_blank'
            rel='noopener noreferrer'
            className='btn help-btn-secondary'
            style={{ display: 'inline-block' }}
          >
            📚 Brain Dump Guide
          </a>
        </div>
      </div>

      <h3>What&apos;s Covered</h3>
      <div className='help-section'>
        <ul className='help-list'>
          <li>📐 Complete LaTeX/KaTeX reference with 20+ examples</li>
          <li>🖼️ Image embedding and optimization guide</li>
          <li>📝 GitHub Flavored Markdown reference</li>
          <li>♿ Accessibility best practices (WCAG 2.2 AA)</li>
          <li>⌨️ Keyboard shortcuts</li>
          <li>🔒 Privacy and security considerations</li>
        </ul>
      </div>
    </div>
  )

  const tabs = [
    { id: 'quick', label: 'Quick Reference' },
    { id: 'latex', label: 'LaTeX' },
    { id: 'images', label: 'Images' },
    { id: 'manual', label: 'Full Manual' }
  ]

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop overlay closes modal on click
    <div
      className='modal-overlay'
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleOverlayClick(e)
        }
      }}
      tabIndex={-1}
    >
      <div
        className='modal-content help-modal'
        ref={modalRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby='help-modal-title'
        aria-describedby='help-modal-desc'
      >
        <div className='modal-header'>
          <h2 id='help-modal-title'>Brain Dump Help</h2>
          <button
            type='button'
            ref={closeButtonRef}
            className='modal-close'
            onClick={onClose}
            aria-label='Close help modal'
          >
            ×
          </button>
        </div>
        <p id='help-modal-desc' className='sr-only'>
          Formatting guide for markdown, LaTeX equations, and images in Brain
          Dump
        </p>

        <div className='modal-body'>
          <div role='tablist' aria-label='Help topics' className='help-tabs'>
            {tabs.map((tab) => (
              <button
                type='button'
                key={tab.id}
                role='tab'
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                className={clsx('help-tab', { active: activeTab === tab.id })}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div
            role='tabpanel'
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className='help-panel'
            // biome-ignore lint/a11y/noNoninteractiveTabindex: WAI-ARIA spec requires tabIndex="0" on tabpanel containers to make them keyboard-focusable when they don't contain inherently focusable content
            tabIndex={0}
          >
            {activeTab === 'quick' && renderQuickReference()}
            {activeTab === 'latex' && renderLatexExamples()}
            {activeTab === 'images' && renderImagesHelp()}
            {activeTab === 'manual' && renderFullManual()}
          </div>
        </div>
      </div>
    </div>
  )
}

HelpModal.propTypes = {
  onClose: PropTypes.func.isRequired
}

export default HelpModal
