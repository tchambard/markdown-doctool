import * as fs from 'fs-extra';

interface ITocEntry {
    path: string;
    description: string;
    title: string;
    example?: boolean;
    done?: boolean;
}

exports.generate = async (_path: string, options: { verbose?: boolean } = {}) => {

    async function _generate(filePath: string, dontSave = false) {
        const stat = await fs.lstat(filePath);
        if (stat.isFile()) {
            let match;
            if ((match = /^(.*)\.(ts|js|coffee)$/.exec(filePath))) {
                let inside, save, example, inSource;
                const tocEntry: ITocEntry = {
                    path: match[1],
                    description: '',
                    title: '',
                };
                let doc = (await fs.readFile(filePath, "utf8")).split(/\r?\n/).map((line) => {
                    const i = line.indexOf('//' + '/ ');
                    if (i >= 0) {
                        line = line.substring(i + 4);
                        if (line[0] === '!') {
                            if (line === "!doc") {
                                inside = true;
                            } else if (line === "!nodoc") {
                                inside = false;
                            } else if (line === "!example") {
                                inside = true;
                                example = true;
                                tocEntry.example = true;
                                save = true;
                            }
                            return null;
                        }
                        if (inside) {
                            if (inSource) {
                                line = "```\n\n" + line;
                                inSource = false;
                            }
                            if (!tocEntry.done) {
                                if (!tocEntry.title && line[0] === '#') {
                                    tocEntry.title = line;
                                } else if (tocEntry.title && line.length > 0) {
                                    tocEntry.description += line + '\n';
                                } else if (tocEntry.description && line.length === 0) tocEntry.done = true;
                            }
                            return line + "  \n";
                        }
                        return null;
                    } else {
                        if (inside && example) {
                            if (!inSource) {
                                line = "\n```javascript\n" + line;
                                inSource = true;
                            }
                            return line + "  \n";
                        }
                        return null;
                    }
                }).filter(function (line) {
                    return line != null;
                }).join("");
                if (inside && inSource) doc += "```\n\n";
                if (doc) {
                    if (!tocEntry.title) throw new Error(filePath + ": doc error: title missing");
                    const p = filePath.substring(0, filePath.lastIndexOf('.')) + ".md";
                    await fs.writeFile(p, doc, "utf8");
                    if (options.verbose) console.log("generated " + p);
                    return [tocEntry];
                }
            }
            return null;
        } else if (stat.isDirectory() && !stat.isSymbolicLink()) {
            const split = filePath.split(/[\/\\]/);
            const isPackage = split[split.length - 2] == 'node_modules';
            let toc: ITocEntry[] = [];
            const files = (await fs.readdir(filePath)).sort();
            for (let i = 0; i < files.length; i++) {
                if (files[i] === 'node_modules') continue;
                const entries = await _generate(filePath + "/" + files[i], isPackage || dontSave);
                if (entries) toc = toc.concat(entries);
            }
            if (isPackage && !dontSave && toc.length) {
                let text: string;
                if (await fs.pathExists(filePath + '/package.json')) {
                    const pkg = JSON.parse(await fs.readFile(filePath + '/package.json', 'utf8'));
                    text = '# ' + pkg.name + '\n\n' + pkg.description + '\n\n';
                } else {
                    text = '# ' + filePath.substring(filePath.lastIndexOf('node_modules') + 13) + '\n\n';
                }
                text += toc.filter(function (entry) {
                    return !entry.example;
                }).map((entry) => {
                    const p = entry.path.substring(entry.path.lastIndexOf('node_modules') + 13);
                    const href = p.substring(p.indexOf('/') + 1) + '.md';
                    return '* [' + p + '](' + href + ')  \n  ' + entry.title.substring(2) + '\n';
                }).join('');
                await fs.writeFile(filePath + "/API.md", text, "utf8");
                if (options.verbose) console.log("generated " + filePath + "/API.md");
                return null;
            }
            return toc;
        } else {
            return null;
        }
    }

    await _generate(_path);
};
