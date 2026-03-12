#!/usr/bin/env bash

set -euo pipefail

REPO_NAME="${REPO_NAME:-huanjie-mvp}"
REPO_DESC="${REPO_DESC:-幻界冒险模拟器 - 纯文字TRPG游戏}"

echo "开始部署到 GitHub Pages..."

if ! command -v gh >/dev/null 2>&1; then
  echo "错误: 未安装 GitHub CLI (gh)" >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "错误: 未安装 git" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "未检测到 GitHub 登录态，请先执行: gh auth login" >&2
  exit 1
fi

OWNER="$(gh api user --jq '.login')"
REPO_FULL="${OWNER}/${REPO_NAME}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "当前目录不是 git 仓库，正在初始化..."
  git init
fi

if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  echo "未检测到提交，创建初始提交..."
  git add -A
  git commit -m "chore: initial commit"
fi

if ! git rev-parse --verify main >/dev/null 2>&1; then
  current_branch="$(git rev-parse --abbrev-ref HEAD)"
  git branch -M main
  echo "已将分支 ${current_branch} 设为 main"
fi

if gh repo view "${REPO_FULL}" >/dev/null 2>&1; then
  echo "仓库已存在: ${REPO_FULL}"
else
  echo "创建仓库: ${REPO_FULL}"
  gh repo create "${REPO_FULL}" --public --description "${REPO_DESC}"
fi

repo_url="https://github.com/${REPO_FULL}.git"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "${repo_url}"
else
  git remote add origin "${repo_url}"
fi

echo "推送 main 分支..."
git push -u origin main

echo "配置 GitHub Pages..."
if gh api "repos/${REPO_FULL}/pages" >/dev/null 2>&1; then
  gh api "repos/${REPO_FULL}/pages" \
    --method PUT \
    -f source[branch]='main' \
    -f source[path]='/'
else
  gh api "repos/${REPO_FULL}/pages" \
    --method POST \
    -f source[branch]='main' \
    -f source[path]='/'
fi

echo "部署完成"
echo "访问地址: https://${OWNER}.github.io/${REPO_NAME}"
