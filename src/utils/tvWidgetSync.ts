import { injectIframeDropdownStyles } from './iframeDropdown';
import { useChartUIStore } from '../store/useChartUIStore';
import { SVGS } from '../components/chart/toolbarIcons';

/**
 * Synchronize custom button states (active class, icons) inside the TradingView iframe.
 */
export function syncButtonStates(doc: Document): void {
  injectIframeDropdownStyles(doc);

  const ghostLineMode = useChartUIStore.getState().ghostLineMode;
  const splitView = useChartUIStore.getState().splitView;

  const ghostLineBtn = doc.getElementById('tv-btn-ghost-line');
  if (ghostLineBtn) {
    ghostLineBtn.innerHTML = SVGS.ghostLine;
    if (ghostLineMode === 'curved') {
      ghostLineBtn.classList.add('active');
    } else {
      ghostLineBtn.classList.remove('active');
    }
  }

  const splitViewBtn = doc.getElementById('tv-btn-split-view');
  if (splitViewBtn) {
    splitViewBtn.innerHTML = splitView ? SVGS.splitView : SVGS.singleView;
    if (splitView) {
      splitViewBtn.classList.add('active');
    } else {
      splitViewBtn.classList.remove('active');
    }
  }
}

