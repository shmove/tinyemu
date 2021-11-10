# tinyemu :)
my nodejs emulator for conor mcbride's tiny machine!!

probably could have made this much more efficient if i made it in python, but i didn't.

also it just instantly crashes atm if there's an infinite loop. will fix that soon maybe probably

## installation
this has no required npm's so as long as you have nodejs installed you should be able to just download tm.js from this repository and run the file without any issues.

## using tinyemu :)
commands | how to use | default value
-------- | ---------- | -------------
reg | prints or sets tiny registers.<br>if you want to print current registers just type `reg`.<br>if you want to set the registers to a new value type smthn like `reg 0F0F`. | 0000
mem | prints or sets tiny memory.<br>if you want to print the current memory just type `mem`.<br>if you want to set the registers to a new value type smthn like `mem 0F0F0F0F0F0F0F0F`. | 0000000000000000
inp | prints or sets tiny input queue.<br>if you want to print the current input queue just type `inp`.<br>if you want to set the input queue to a new value type smthn like `inp B1FF015BA3`. |  |
trace | runs a tiny trace with current registers, memory and input queue. | N/A
help | displays a list of tinyemu :) commands (like this but less detailed). | N/A

## contact
msg me at @shmove#0615 on discord if you need any help with this or want to suggest anything.
