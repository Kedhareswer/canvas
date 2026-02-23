export const ARTICLE_TEMPLATE = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath,amssymb}
\\usepackage{geometry}
\\geometry{margin=1in}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{xcolor}
\\usepackage{booktabs}

\\title{Untitled Document}
\\author{Author Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}

Begin writing here.

\\end{document}
`;

const REPORT_TEMPLATE = `\\documentclass[11pt,a4paper]{report}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath,amssymb}
\\usepackage{geometry}
\\geometry{margin=1in}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{xcolor}
\\usepackage{booktabs}

\\title{Untitled Report}
\\author{Author Name}
\\date{\\today}

\\begin{document}

\\maketitle
\\tableofcontents

\\chapter{Introduction}

Begin writing here.

\\end{document}
`;

const BLANK_TEMPLATE = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath,amssymb}

\\begin{document}

% Start writing here

\\end{document}
`;

export const TEMPLATES: Record<string, { name: string; source: string }> = {
  article: { name: "Article", source: ARTICLE_TEMPLATE },
  report: { name: "Report", source: REPORT_TEMPLATE },
  blank: { name: "Blank", source: BLANK_TEMPLATE },
};
