import math

c = 2.9979 * 1e8
h = 6.626 * 1e-34

# part1
W = 25
efficiency = 0.2
lamba = 500 * 1e-9

f = c / lamba
E = h * f
number = W * efficiency / E
# print(number)

# part2
V = 2.4
C = 0.7
r = 0.01

phi = V * C
I = phi / (4 * math.pi)
M = phi / (4 * math.pi * r**2)
Q = phi * 5 * 60
# print(Q)

# part3 
dist = 1
pupil = 6 * 1e-3
E = phi * 1 / (4 * math.pi * dist ** 2)
# print(E)

# part4
dist = 2
W = 200
E = W * 0.2 * 1 / (4 * math.pi * dist ** 2)
# print(E)
E = 685 * 0.1 * E
# print(E)

# part 5
i_s = 40
d_x = 0.65
d_s = 0.35
ix = i_s*d_x*d_x/d_s/d_s
# print(ix)

# part6
L = 5000
B = L * math.pi
# print(B)
phi = L * math.pi * 0.1*0.1
# print(phi)

# part7
L = 6000
B = L * math.pi
print(B)
phi = L * math.pi * 0.1*0.1
print(phi)