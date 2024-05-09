import json, re
from pathlib import Path
import uritemplate

def github_action_notice(path, url, line):
    """
    Return a GitHub action notice with file path, URL, and line number.

    Parameters:
        path (str): File path.
        url (str): URL.
        line (int): Line number.
    """
    return f"::warning file={path},line={line}::Annotation: {url}"

def find_test_line_number(test_content, test_name):
    """
    Find the line number of a test in the JSON content.

    Parameters:
        test_content (str): JSON content.
        test_name (str): Test name.

    Returns:
        int: Line number of the test.
    """
    lines = test_content.split("\n")
    for i, line in enumerate(lines, start=1):
        if test_name in line:
            return i
    return 1

def clear_previous_annotations():
    """
    Clear previous GitHub action annotations.
    """
    print("::remove-matcher owner=me::")

json_file_path = Path("bin/specification_urls.json")

BIN_DIR = Path(__file__).parent
urls = json.loads(BIN_DIR.joinpath("specification_urls.json").read_text())

clear_previous_annotations()

for file_path in Path("tests").rglob("*.json"):

    with file_path.open("r", encoding="utf-8") as f:
        changed_file_content = f.read()

    try:
        json_content = json.loads(changed_file_content)
    except json.JSONDecodeError:
        print(f"::error file={file_path}::Failed to parse JSON content")

    for test in json_content:
        if "specification" in test:
            line_number = find_test_line_number(changed_file_content, test.get("description") )

            for specification_object in test["specification"]:
                for spec, section in specification_object.items():
                    draft = file_path.parent.name
                    if spec in ["quote"]:
                        continue
                    elif spec in ["core", "validation", "hyper-schema"]:
                        template = uritemplate.URITemplate(urls[draft][spec])
                    elif re.match("^rfc\\d+$", spec):
                        template = uritemplate.URITemplate(urls["rfc"])
                    elif  re.match("^iso\\d+$", spec):
                        template = uritemplate.URITemplate(urls["iso"])
                    else:
                        template = uritemplate.URITemplate(urls[spec])
                    url = template.expand(spec=spec, section=section) 

                    print(github_action_notice(file_path, url, line_number))
