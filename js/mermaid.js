import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.15.0/dist/mermaid.esm.min.mjs';

const diagrams = Array.from(document.querySelectorAll('.post-content .mermaid-diagram'));

if (diagrams.length) {
    const sources = diagrams.map((diagram) => diagram.textContent);

    mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        fontFamily: 'Inter, Noto Sans KR, sans-serif',
        themeVariables: {
            primaryColor: '#e8f2ed',
            primaryTextColor: '#252927',
            primaryBorderColor: '#087f6b',
            lineColor: '#5f706b',
            secondaryColor: '#eef5f2',
            tertiaryColor: '#f7f6f1',
            edgeLabelBackground: '#ffffff'
        },
        flowchart: {
            htmlLabels: true,
            useMaxWidth: true
        }
    });

    try {
        await mermaid.run({ nodes: diagrams });
    } catch (error) {
        diagrams.forEach((diagram, index) => {
            if (!diagram.querySelector('svg')) {
                diagram.classList.add('mermaid-error');
                diagram.textContent = sources[index];
                diagram.removeAttribute('role');
                diagram.removeAttribute('aria-label');
            }
        });
        console.error('Mermaid diagram rendering failed.', error);
    }
}
