# Pin this repository to the MbD-Record GitHub account.
#
# `gh` acts as whichever account is active, and this machine has two
# authenticated (rock-solid-sites and MbD-Record). GH_TOKEN below overrides
# that so every `gh` call here targets MbD-Record explicitly. Without it, a
# repo creation or push can silently land on the wrong account.
#
# Usage:
#   $env:GH_TOKEN = (gh auth token --user MbD-Record)
#   gh repo create MbD-Record/MbD --public --source=. --push
#   Remove-Item Env:\GH_TOKEN

$env:GH_TOKEN = (gh auth token --user MbD-Record)