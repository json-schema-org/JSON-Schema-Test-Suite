import json
from pathlib import Path

def github_action_notice(file, url, line):
    """
    Print GitHub action notice with file path, URL, and line number.

    Parameters:
        file (str): File path.
        url (str): URL.
        line (int): Line number.
    """
    return f"::warning file={file},line={line}::Annotation: {url}"

def find_test_line_number(test_content, test_name):
    """
    Find the line number of a test in the JSON content.

    Parameters:
        test_content (str): JSON content.
        test_name (str): Test name.

    Returns:
        int: Line number of the test.
    """
    lines = test_content.split("\n")  # Split content into lines
    for i, line in enumerate(lines, start=1):  # Iterate over lines
        if test_name in line:  # Check if test name is found in the line
            return i  # Return the line number if found
    return 1  # Return None if test name is not found

# Specify the path to the JSON file using pathlib.Path
json_file_path = Path("bin/specification_urls.json")

# Read specification URLs from JSON file using pathlib.Path
with json_file_path.open("r", encoding="utf-8") as f:
    urls = json.load(f)

# Iterate through JSON files in tests folder and subdirectories
for file_path in Path("tests").rglob("*.json"):
    # Read the file content using pathlib.Path
    with file_path.open('r', encoding='utf-8') as f:
        changed_file_content = f.read()
        
    # Parse JSON content
    try:
        json_content = json.loads(changed_file_content)
        for test in json_content:
            if "specification" in test:
                line_number = find_test_line_number(changed_file_content, test.get("description") )

                for specification_object in test["specification"]:
                    for spec, section in specification_object.items():
                        draft = file_path.parent.name
                        if spec in ["quote"]:
                            continue
                        elif spec in ["core", "validation", "hyper-schema"]:
                            url = urls[draft][spec].format(spec=spec, section=section)
                        else:
                            url = urls[spec].format(spec=spec, section=section)
                        annotation = github_action_notice(file_path, url, line_number)
                        print(annotation)

    except json.JSONDecodeError:
        print(f"::error file={file_path}::Failed to parse JSON content")
