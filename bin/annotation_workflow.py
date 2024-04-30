import json
from pathlib import Path
import re

# Function to print GitHub action notice
def print_github_action_notice(file, url):
    print(f"::warning file={file},line=1::Annotation: {url}")

# Read specification URLs from JSON file
with open("specification_urls.json", "r") as f:
    urls = json.load(f)

# Iterate through files in tests folder
for root, dirs, files in Path("tests").walk():
    for file in files:
        if file.endswith('.json'):  # Check if file is JSON
            file_path = root / file
            # Read the file content
            with open(file_path, "r") as f:
                changed_file_content = f.read()

            # Parse JSON content
            try:
                json_content = json.loads(changed_file_content)
                for test in json_content:
                    if "specification" in test:
                        for specification_object in test["specification"]:
                            for spec, section in specification_object.items():
                                draft = root.split('/')[-1]
                                if spec in ["core", "validation", "hyper-schema"]:
                                    print_github_action_notice(file_path, urls[draft][spec] + section)
                                elif spec in ["quote"]:
                                    continue
                                elif spec in ["ecma262", "perl5"]:
                                    print_github_action_notice(file_path, urls[spec] + section)
                                elif re.match("^rfc\\d+$", spec):
                                    print_github_action_notice(file_path, urls["rfc"] + spec + ".txt#" + section)
                                else:
                                    print_github_action_notice(file_path, urls["iso"])
            except json.JSONDecodeError:
                print(f"Failed to parse JSON content for file: {file_path}")
