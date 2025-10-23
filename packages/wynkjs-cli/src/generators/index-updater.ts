import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { loadConfig } from "../utils.js";
import { cyan, yellow, green } from "kleur/colors";

export function updateIndexFile(className: string, importPath: string) {
  const config = loadConfig();
  const indexPath = join(config.srcDir, "index.ts");

  if (!existsSync(indexPath)) {
    console.log(yellow(`⚠ index.ts not found at ${indexPath}`));
    console.log(
      cyan(
        `   Please manually add: import { ${className} } from "${importPath}";`
      )
    );
    console.log(cyan(`   And add ${className} to controllers array\n`));
    return;
  }

  let content = readFileSync(indexPath, "utf-8");

  // Check if import already exists
  if (content.includes(`from "${importPath}"`)) {
    console.log(yellow(`⚠ Import for ${className} already exists in index.ts`));
    return;
  }

  // Find the last import statement
  const importRegex = /import\s+{[^}]+}\s+from\s+["'][^"']+["'];?/g;
  const imports = content.match(importRegex);

  if (!imports || imports.length === 0) {
    console.log(yellow(`⚠ No imports found in index.ts`));
    console.log(cyan(`   Please manually add the import and controller\n`));
    return;
  }

  const lastImport = imports[imports.length - 1];
  const lastImportIndex = content.lastIndexOf(lastImport);
  const insertPosition = lastImportIndex + lastImport.length;

  // Add new import
  const newImport = `\nimport { ${className} } from "${importPath}";`;
  content =
    content.slice(0, insertPosition) +
    newImport +
    content.slice(insertPosition);

  // Find controllers array and add the new controller
  const controllersMatch = content.match(/controllers:\s*\[([\s\S]*?)\]/);

  if (controllersMatch) {
    const controllersContent = controllersMatch[1].trim();
    const controllers = controllersContent
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (!controllers.includes(className)) {
      controllers.push(className);
      const newControllersArray = controllers.join(", ");
      content = content.replace(
        /controllers:\s*\[[^\]]*\]/,
        `controllers: [${newControllersArray}]`
      );

      writeFileSync(indexPath, content);
      console.log(green(`✔ Updated index.ts with ${className}`));
    } else {
      console.log(yellow(`⚠ ${className} already in controllers array`));
    }
  } else {
    console.log(yellow(`⚠ Could not find controllers array in index.ts`));
    console.log(
      cyan(`   Please manually add ${className} to the controllers array\n`)
    );
  }
}
