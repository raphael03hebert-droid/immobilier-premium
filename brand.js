(() => {
  const officialName = 'Geneviève Côté';
  document.title = `${officialName} — Courtage immobilier`;
  function applyBrand(root = document) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => { if (node.parentElement?.tagName !== 'SCRIPT' && node.nodeValue?.includes('MaisonNord')) node.nodeValue = node.nodeValue.replaceAll('MaisonNord', officialName); });
    root.querySelectorAll?.('img.brand-logo, img.auth-logo').forEach(image => { image.src = 'assets/logo-genevieve-cote.jpg'; image.alt = `${officialName} — Équipe de courtiers immobiliers`; });
  }
  new MutationObserver(() => applyBrand()).observe(document.body, { childList: true, subtree: true, characterData: true });
  applyBrand();
})();
