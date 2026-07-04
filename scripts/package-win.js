import { resolve } from 'path'
import { spawnSync } from 'child_process'

// 使用项目内的缓存目录，避免符号链接权限问题
process.env.ELECTRON_BUILDER_CACHE = resolve('.cache/electron-builder')
process.env.ELECTRON_MIRROR = process.env.ELECTRON_MIRROR || 'https://npmmirror.com/mirrors/electron/'
process.env.ELECTRON_BUILDER_BINARIES_MIRROR = process.env.ELECTRON_BUILDER_BINARIES_MIRROR || 'https://npmmirror.com/mirrors/electron-builder-binaries/'

// 直接用 node 运行底层 JS 入口文件，绕过 cmd/psl 包装器的兼容问题
function run(file, args, label) {
    console.log(`\n${label}`)
    const result = spawnSync(process.execPath, [resolve(file), ...args], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env,
        cwd: process.cwd()
    })
    if (result.stdout) process.stdout.write(result.stdout)
    if (result.stderr) process.stderr.write(result.stderr)
    if (result.status !== 0) {
        console.error(`\n❌ Failed with exit code ${result.status}`)
        process.exit(result.status || 1)
    }
}

run('node_modules/electron-vite/bin/electron-vite.js', ['build'], '📦 Building with electron-vite...')
run('node_modules/electron-builder/out/cli/cli.js', ['--win', '--config', 'electron-builder.yml'], '📦 Packaging Windows installer...')

console.log('\n✅ Done! Installer is in dist/')
