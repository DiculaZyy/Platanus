import { exec as cp_exec } from 'child_process';
import { promisify } from "util";

export interface Shortcut {
    FullName : string;
    Arguments? : string;
    Description? : string;
    Hotkey? : string;
    IconLocation? : string;
    RelativePath? : string | null,
    TargetPath : string;
    WindowStyle? : number,
    WorkingDirectory? : string;
}

const exec = promisify(cp_exec);

export async function read(filepath : string) {
    const cmd = `powershell.exe -Command "`
    + `$sh = New-Object -ComObject WScript.Shell;`
    + `$sc = $sh.CreateShortcut('${filepath}');`
    + `$sc | ConvertTo-Json;`
    +`"`;
    const {stdout, stderr} = await exec(cmd);
    if (stderr) {
        throw stderr;
    }
    const sc : Shortcut = JSON.parse(stdout);
    return sc;
}

export async function create(filepath : string, target : string) {
    if (!filepath.endsWith('.lnk'))
        filepath = filepath + '.lnk';
    const cmd = `powershell.exe -Command "`
    +`$WScriptShell = New-Object -ComObject WScript.Shell;`
    +`$TargetFile = '${target}';`
    +`$ShortcutFile = '${filepath}';`
    +`$Shortcut = $WScriptShell.CreateShortcut($ShortcutFile);`
    +`$Shortcut.TargetPath = $TargetFile;`
    +`$Shortcut.Save();`
    +`"`;
    const {stderr} = await exec(cmd);
    if (stderr) {
        throw stderr;
    }
}
