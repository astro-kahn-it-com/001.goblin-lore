import sys

def parse(filename):
    with open(filename, 'r') as f:
        content = f.read()
    print(content)

if __name__ == "__main__":
    parse(sys.argv[1])
