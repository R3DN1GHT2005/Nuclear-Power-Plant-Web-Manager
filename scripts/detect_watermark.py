import re
def detect_watermark(text):
    character="\u200b"
    count=text.count(character)
    return count

if __name__ == "__main__":
    rss_txt=input("Introdu textul RSS: ")
    count=detect_watermark(rss_txt)
    print(f"Userul cu id ul {count}!")